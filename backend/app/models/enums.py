import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MODERATOR = "moderator"
    USER = "user"


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    UNISEX = "unisex"
    FAMILY = "family"


class ToiletType(str, enum.Enum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    PORTABLE = "portable"


class PaperType(str, enum.Enum):
    UNKNOWN = "unknown"
    NONE = "none"
    IN_CABIN = "in_cabin"
    DISPENSER = "dispenser"
    BOTH = "both"


class ReportTargetType(str, enum.Enum):
    TOILET = "toilet"
    REVIEW = "review"
    USER = "user"


class ReportReason(str, enum.Enum):
    FAKE = "fake"
    INAPPROPRIATE = "inappropriate"
    SPAM = "spam"
    OUTDATED = "outdated"
    OTHER = "other"


class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    REJECTED = "rejected"
