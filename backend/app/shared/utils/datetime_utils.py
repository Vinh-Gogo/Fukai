"""
Date and time utilities for the RAG platform
"""
from datetime import datetime, timedelta, timezone, date
from typing import Optional, Union, Dict, Any
import time
import logging
from dateutil import parser as date_parser
from dateutil.relativedelta import relativedelta

logger = logging.getLogger(__name__)


class DateTimeUtils:
    """Date and time utility functions"""

    @staticmethod
    def now_utc() -> datetime:
        """Get current UTC datetime"""
        return datetime.now(timezone.utc)

    @staticmethod
    def now_local() -> datetime:
        """Get current local datetime"""
        return datetime.now()

    @staticmethod
    def timestamp_to_datetime(timestamp: Union[int, float]) -> datetime:
        """Convert Unix timestamp to datetime"""
        return datetime.fromtimestamp(timestamp, tz=timezone.utc)

    @staticmethod
    def datetime_to_timestamp(dt: datetime) -> float:
        """Convert datetime to Unix timestamp"""
        if dt.tzinfo is None:
            # Assume UTC if no timezone
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()

    @staticmethod
    def iso_string_to_datetime(iso_string: str) -> datetime:
        """Parse ISO format datetime string"""
        try:
            # Handle 'Z' suffix for UTC
            if iso_string.endswith('Z'):
                iso_string = iso_string[:-1] + '+00:00'
            return datetime.fromisoformat(iso_string.replace('Z', '+00:00'))
        except ValueError:
            # Fallback to dateutil parser
            return date_parser.parse(iso_string)

    @staticmethod
    def datetime_to_iso_string(dt: datetime) -> str:
        """Convert datetime to ISO format string"""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()

    @staticmethod
    def format_datetime(dt: datetime, format_string: str = "%Y-%m-%d %H:%M:%S") -> str:
        """Format datetime to string"""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.strftime(format_string)

    @staticmethod
    def parse_datetime(date_string: str, format_string: Optional[str] = None) -> datetime:
        """Parse datetime from string"""
        try:
            if format_string:
                return datetime.strptime(date_string, format_string)
            else:
                # Try ISO format first
                return DateTimeUtils.iso_string_to_datetime(date_string)
        except (ValueError, TypeError):
            # Fallback to dateutil
            return date_parser.parse(date_string)

    @staticmethod
    def add_time(dt: datetime, days: int = 0, hours: int = 0,
                minutes: int = 0, seconds: int = 0) -> datetime:
        """Add time to datetime"""
        return dt + timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)

    @staticmethod
    def subtract_time(dt: datetime, days: int = 0, hours: int = 0,
                     minutes: int = 0, seconds: int = 0) -> datetime:
        """Subtract time from datetime"""
        return dt - timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)

    @staticmethod
    def time_difference(dt1: datetime, dt2: datetime) -> Dict[str, Any]:
        """Calculate time difference between two datetimes"""
        if dt1.tzinfo is None:
            dt1 = dt1.replace(tzinfo=timezone.utc)
        if dt2.tzinfo is None:
            dt2 = dt2.replace(tzinfo=timezone.utc)

        delta = dt1 - dt2

        return {
            'total_seconds': delta.total_seconds(),
            'days': delta.days,
            'hours': delta.seconds // 3600,
            'minutes': (delta.seconds % 3600) // 60,
            'seconds': delta.seconds % 60,
            'microseconds': delta.microseconds
        }

    @staticmethod
    def is_future(dt: datetime) -> bool:
        """Check if datetime is in the future"""
        now = DateTimeUtils.now_utc()
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt > now

    @staticmethod
    def is_past(dt: datetime) -> bool:
        """Check if datetime is in the past"""
        now = DateTimeUtils.now_utc()
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt < now

    @staticmethod
    def start_of_day(dt: datetime) -> datetime:
        """Get start of day for datetime"""
        return dt.replace(hour=0, minute=0, second=0, microsecond=0)

    @staticmethod
    def end_of_day(dt: datetime) -> datetime:
        """Get end of day for datetime"""
        return dt.replace(hour=23, minute=59, second=59, microsecond=999999)

    @staticmethod
    def start_of_week(dt: datetime) -> datetime:
        """Get start of week (Monday) for datetime"""
        days_to_subtract = dt.weekday()  # Monday is 0
        return DateTimeUtils.start_of_day(dt - timedelta(days=days_to_subtract))

    @staticmethod
    def end_of_week(dt: datetime) -> datetime:
        """Get end of week (Sunday) for datetime"""
        days_to_add = 6 - dt.weekday()  # Sunday is 6
        return DateTimeUtils.end_of_day(dt + timedelta(days=days_to_add))

    @staticmethod
    def start_of_month(dt: datetime) -> datetime:
        """Get start of month for datetime"""
        return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    @staticmethod
    def end_of_month(dt: datetime) -> datetime:
        """Get end of month for datetime"""
        # Calculate next month and subtract one day
        next_month = dt.replace(day=28) + timedelta(days=4)
        last_day = next_month - timedelta(days=next_month.day)
        return DateTimeUtils.end_of_day(last_day)

    @staticmethod
    def human_readable_time_ago(dt: datetime) -> str:
        """Get human readable time ago string"""
        now = DateTimeUtils.now_utc()
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        diff = DateTimeUtils.time_difference(now, dt)

        if diff['days'] > 365:
            years = diff['days'] // 365
            return f"{years} year{'s' if years != 1 else ''} ago"
        elif diff['days'] > 30:
            months = diff['days'] // 30
            return f"{months} month{'s' if months != 1 else ''} ago"
        elif diff['days'] > 0:
            return f"{diff['days']} day{'s' if diff['days'] != 1 else ''} ago"
        elif diff['hours'] > 0:
            return f"{diff['hours']} hour{'s' if diff['hours'] != 1 else ''} ago"
        elif diff['minutes'] > 0:
            return f"{diff['minutes']} minute{'s' if diff['minutes'] != 1 else ''} ago"
        else:
            return "just now"

    @staticmethod
    def human_readable_duration(seconds: Union[int, float]) -> str:
        """Convert seconds to human readable duration"""
        if seconds < 60:
            return f"{int(seconds)} second{'s' if seconds != 1 else ''}"
        elif seconds < 3600:
            minutes = int(seconds // 60)
            remaining_seconds = int(seconds % 60)
            if remaining_seconds > 0:
                return f"{minutes} minute{'s' if minutes != 1 else ''} {remaining_seconds} second{'s' if remaining_seconds != 1 else ''}"
            return f"{minutes} minute{'s' if minutes != 1 else ''}"
        elif seconds < 86400:
            hours = int(seconds // 3600)
            remaining_minutes = int((seconds % 3600) // 60)
            if remaining_minutes > 0:
                return f"{hours} hour{'s' if hours != 1 else ''} {remaining_minutes} minute{'s' if remaining_minutes != 1 else ''}"
            return f"{hours} hour{'s' if hours != 1 else ''}"
        else:
            days = int(seconds // 86400)
            remaining_hours = int((seconds % 86400) // 3600)
            if remaining_hours > 0:
                return f"{days} day{'s' if days != 1 else ''} {remaining_hours} hour{'s' if remaining_hours != 1 else ''}"
            return f"{days} day{'s' if days != 1 else ''}"

    @staticmethod
    def parse_relative_time(time_string: str) -> Optional[datetime]:
        """Parse relative time strings like '1h', '30m', '2d'"""
        if not time_string:
            return None

        # Match patterns like 1h, 30m, 2d, 1w, etc.
        pattern = r'^(\d+)([smhdw])$'
        match = re.match(pattern, time_string.lower())

        if not match:
            return None

        value, unit = match.groups()
        value = int(value)

        now = DateTimeUtils.now_utc()

        if unit == 's':
            return now - timedelta(seconds=value)
        elif unit == 'm':
            return now - timedelta(minutes=value)
        elif unit == 'h':
            return now - timedelta(hours=value)
        elif unit == 'd':
            return now - timedelta(days=value)
        elif unit == 'w':
            return now - timedelta(weeks=value)

        return None

    @staticmethod
    def get_age_in_years(birth_date: Union[date, datetime]) -> int:
        """Calculate age in years from birth date"""
        today = date.today()

        if isinstance(birth_date, datetime):
            birth_date = birth_date.date()

        age = today.year - birth_date.year

        # Adjust if birthday hasn't occurred this year
        if today.month < birth_date.month or \
           (today.month == birth_date.month and today.day < birth_date.day):
            age -= 1

        return age

    @staticmethod
    def is_weekend(dt: datetime) -> bool:
        """Check if datetime falls on weekend"""
        return dt.weekday() >= 5  # Saturday = 5, Sunday = 6

    @staticmethod
    def is_business_day(dt: datetime) -> bool:
        """Check if datetime falls on business day (Monday-Friday)"""
        return not DateTimeUtils.is_weekend(dt)

    @staticmethod
    def next_business_day(dt: datetime) -> datetime:
        """Get next business day"""
        next_day = dt + timedelta(days=1)
        while not DateTimeUtils.is_business_day(next_day):
            next_day += timedelta(days=1)
        return next_day

    @staticmethod
    def business_days_between(start_date: datetime, end_date: datetime) -> int:
        """Calculate number of business days between two dates"""
        if start_date > end_date:
            start_date, end_date = end_date, start_date

        business_days = 0
        current_date = start_date

        while current_date <= end_date:
            if DateTimeUtils.is_business_day(current_date):
                business_days += 1
            current_date += timedelta(days=1)

        return business_days


class TimezoneUtils:
    """Timezone-related utilities"""

    @staticmethod
    def utc_to_local(dt: datetime, timezone_offset: int = 0) -> datetime:
        """Convert UTC datetime to local time with offset"""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        local_tz = timezone(timedelta(hours=timezone_offset))
        return dt.astimezone(local_tz)

    @staticmethod
    def local_to_utc(dt: datetime, timezone_offset: int = 0) -> datetime:
        """Convert local datetime to UTC"""
        if dt.tzinfo is None:
            # For naive datetime, assume it's in the specified timezone
            local_tz = timezone(timedelta(hours=timezone_offset))
            dt = dt.replace(tzinfo=local_tz)

        return dt.astimezone(timezone.utc)


def format_duration(start_time: datetime, end_time: Optional[datetime] = None) -> str:
    """Format duration between two times or from start time to now"""
    if end_time is None:
        end_time = DateTimeUtils.now_utc()

    diff = DateTimeUtils.time_difference(end_time, start_time)
    return DateTimeUtils.human_readable_duration(diff['total_seconds'])


def validate_date_range(start_date: datetime, end_date: datetime) -> bool:
    """Validate that start_date is before end_date"""
    return start_date < end_date


def get_date_range(start_date: datetime, days: int) -> tuple[datetime, datetime]:
    """Get date range from start date for specified number of days"""
    end_date = start_date + timedelta(days=days)
    return start_date, end_date


# Import re at the end to avoid circular imports
import re
