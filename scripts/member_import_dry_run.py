#!/usr/bin/env python
"""
Dry-run validator for the IWFSA member import spreadsheet.

Usage:
  python scripts/member_import_dry_run.py --input Members.xlsx --output-dir docs/imports
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
import zipfile
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple
import xml.etree.ElementTree as ET


NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_OFFICE_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"

MAIN = f"{{{NS_MAIN}}}"
CELL_REF_RE = re.compile(r"^([A-Z]+)(\d+)$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

EXPECTED_HEADERS = [
    "No",
    "First Name",
    "Surname",
    "Email",
    "Organisation",
    "Username",
    "Status",
    "Groups",
    "Roles",
]
REQUIRED_HEADERS = ["First Name", "Surname", "Email"]
ALLOWED_STATUSES = {"Active", "Suspended"}


@dataclass
class Issue:
    row_number: int
    issue_code: str
    field: str
    value: str
    message: str


def col_to_num(col: str) -> int:
    result = 0
    for ch in col:
        result = result * 26 + (ord(ch) - ord("A") + 1)
    return result


def load_first_sheet_rows(xlsx_path: Path) -> Tuple[Dict[int, Dict[str, str]], List[str]]:
    with zipfile.ZipFile(xlsx_path, "r") as zf:
        files = {name: zf.read(name) for name in zf.namelist()}

    # Shared strings
    shared_strings: List[str] = []
    if "xl/sharedStrings.xml" in files:
        sst = ET.fromstring(files["xl/sharedStrings.xml"])
        for si in sst.findall(f"{MAIN}si"):
            t = si.find(f"{MAIN}t")
            if t is not None:
                shared_strings.append(t.text or "")
            else:
                parts = [node.text or "" for node in si.findall(f".//{MAIN}t")]
                shared_strings.append("".join(parts))

    # Workbook relationships
    wb = ET.fromstring(files["xl/workbook.xml"])
    rels = ET.fromstring(files["xl/_rels/workbook.xml.rels"])
    relmap = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall(f"{{{NS_PKG_REL}}}Relationship")
    }

    first_sheet = wb.find(f"{MAIN}sheets").find(f"{MAIN}sheet")
    rid = first_sheet.attrib[f"{{{NS_OFFICE_REL}}}id"]
    target = relmap[rid]
    if not target.startswith("xl/"):
        target = f"xl/{target}"

    ws = ET.fromstring(files[target])
    rows = ws.findall(f"{MAIN}sheetData/{MAIN}row")

    parsed: Dict[int, Dict[str, str]] = {}
    for row in rows:
        rnum = int(row.attrib.get("r", "0"))
        row_map: Dict[str, str] = {}
        for c in row.findall(f"{MAIN}c"):
            ref = c.attrib.get("r", "")
            m = CELL_REF_RE.match(ref)
            if not m:
                continue
            col = m.group(1)
            v = c.find(f"{MAIN}v")
            value = "" if v is None else (v.text or "")
            if c.attrib.get("t") == "s" and value:
                try:
                    value = shared_strings[int(value)]
                except (ValueError, IndexError):
                    pass
            row_map[col] = value.strip()
        parsed[rnum] = row_map

    return parsed, shared_strings


def header_map(header_row: Dict[str, str]) -> Dict[str, str]:
    # column letter -> header text
    return {col: name.strip() for col, name in header_row.items() if name.strip()}


def normalize_row(row: Dict[str, str], headers_by_col: Dict[str, str]) -> Dict[str, str]:
    out: Dict[str, str] = {}
    for col, header in headers_by_col.items():
        out[header] = row.get(col, "").strip()
    return out


def validate_rows(rows: Dict[int, Dict[str, str]]) -> Tuple[Dict[str, object], List[Issue]]:
    issues: List[Issue] = []
    header_row = rows.get(1, {})
    headers_by_col = header_map(header_row)
    headers_set = set(headers_by_col.values())

    missing_expected_headers = [h for h in EXPECTED_HEADERS if h not in headers_set]
    missing_required_headers = [h for h in REQUIRED_HEADERS if h not in headers_set]

    for h in missing_required_headers:
        issues.append(
            Issue(
                row_number=1,
                issue_code="missing_required_header",
                field=h,
                value="",
                message=f"Required header '{h}' is missing.",
            )
        )

    if missing_expected_headers:
        for h in missing_expected_headers:
            issues.append(
                Issue(
                    row_number=1,
                    issue_code="missing_expected_header",
                    field=h,
                    value="",
                    message=f"Expected header '{h}' is missing.",
                )
            )

    data_row_numbers = sorted(r for r in rows.keys() if r >= 2)
    total_data_rows = 0
    valid_rows = 0
    email_seen: Dict[str, int] = {}
    duplicate_email_rows = 0
    missing_required_rows = 0
    invalid_email_rows = 0
    status_counts = {"Active": 0, "Suspended": 0, "Other": 0}

    for rnum in data_row_numbers:
        raw_row = rows[rnum]
        normalized = normalize_row(raw_row, headers_by_col)

        # Skip fully empty rows
        if not any(normalized.values()):
            continue

        total_data_rows += 1

        first_name = normalized.get("First Name", "")
        surname = normalized.get("Surname", "")
        email = normalized.get("Email", "")
        status = normalized.get("Status", "")

        row_has_missing_required = False
        if not first_name:
            row_has_missing_required = True
            issues.append(
                Issue(
                    row_number=rnum,
                    issue_code="missing_required_value",
                    field="First Name",
                    value="",
                    message="First Name is required.",
                )
            )
        if not surname:
            row_has_missing_required = True
            issues.append(
                Issue(
                    row_number=rnum,
                    issue_code="missing_required_value",
                    field="Surname",
                    value="",
                    message="Surname is required.",
                )
            )
        if not email:
            row_has_missing_required = True
            issues.append(
                Issue(
                    row_number=rnum,
                    issue_code="missing_required_value",
                    field="Email",
                    value="",
                    message="Email is required.",
                )
            )

        if row_has_missing_required:
            missing_required_rows += 1

        if email:
            email_key = email.lower()
            if not EMAIL_RE.match(email):
                invalid_email_rows += 1
                issues.append(
                    Issue(
                        row_number=rnum,
                        issue_code="invalid_email",
                        field="Email",
                        value=email,
                        message="Email format is invalid.",
                    )
                )
            if email_key in email_seen:
                duplicate_email_rows += 1
                issues.append(
                    Issue(
                        row_number=rnum,
                        issue_code="duplicate_email",
                        field="Email",
                        value=email,
                        message=f"Duplicate email (first seen on row {email_seen[email_key]}).",
                    )
                )
            else:
                email_seen[email_key] = rnum

        # Status: default blank -> Active (import behavior), flag unknown values.
        effective_status = status if status else "Active"
        if effective_status == "Active":
            status_counts["Active"] += 1
        elif effective_status == "Suspended":
            status_counts["Suspended"] += 1
        else:
            status_counts["Other"] += 1
            issues.append(
                Issue(
                    row_number=rnum,
                    issue_code="invalid_status",
                    field="Status",
                    value=status,
                    message="Status should be Active or Suspended (blank defaults to Active).",
                )
            )

        row_issues = [i for i in issues if i.row_number == rnum]
        if not row_issues:
            valid_rows += 1

    unique_issue_rows = len({i.row_number for i in issues if i.row_number >= 2})
    summary: Dict[str, object] = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "schema": {
            "expected_headers": EXPECTED_HEADERS,
            "required_headers": REQUIRED_HEADERS,
            "allowed_status_values": sorted(ALLOWED_STATUSES),
        },
        "counts": {
            "total_data_rows": total_data_rows,
            "valid_rows": valid_rows,
            "rows_with_issues": unique_issue_rows,
            "missing_required_rows": missing_required_rows,
            "invalid_email_rows": invalid_email_rows,
            "duplicate_email_rows": duplicate_email_rows,
        },
        "status_breakdown": status_counts,
        "missing_expected_headers": missing_expected_headers,
        "missing_required_headers": missing_required_headers,
    }
    return summary, issues


def write_reports(
    output_dir: Path,
    report_prefix: str,
    summary: Dict[str, object],
    issues: List[Issue],
) -> Tuple[Path, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    summary_path = output_dir / f"{report_prefix}-summary.json"
    issues_path = output_dir / f"{report_prefix}-issues.csv"

    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")

    with issues_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["row_number", "issue_code", "field", "value", "message"])
        for issue in issues:
            writer.writerow(
                [issue.row_number, issue.issue_code, issue.field, issue.value, issue.message]
            )

    return summary_path, issues_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Dry-run validator for member import xlsx files.")
    parser.add_argument("--input", required=True, type=Path, help="Path to source .xlsx file.")
    parser.add_argument(
        "--output-dir",
        default=Path("docs/imports"),
        type=Path,
        help="Directory where report artifacts will be written.",
    )
    parser.add_argument(
        "--report-prefix",
        default="member-import-dry-run",
        help="Prefix for output report filenames.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.input.exists():
        print(f"Input file not found: {args.input}", file=sys.stderr)
        return 2

    try:
        rows, _ = load_first_sheet_rows(args.input)
        summary, issues = validate_rows(rows)
        summary_path, issues_path = write_reports(
            args.output_dir, args.report_prefix, summary, issues
        )
    except Exception as exc:
        print(f"Dry-run failed: {exc}", file=sys.stderr)
        return 2

    print(f"Dry-run summary: {summary_path}")
    print(f"Dry-run issues : {issues_path}")
    print(f"Rows with issues: {summary['counts']['rows_with_issues']}")

    # Return non-zero when blocking issues exist.
    blocking = (
        summary["counts"]["missing_required_rows"] > 0
        or summary["counts"]["invalid_email_rows"] > 0
        or summary["counts"]["duplicate_email_rows"] > 0
        or len(summary["missing_required_headers"]) > 0
    )
    return 1 if blocking else 0


if __name__ == "__main__":
    sys.exit(main())
