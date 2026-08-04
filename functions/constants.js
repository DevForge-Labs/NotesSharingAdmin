const USER_MANAGEMENT_VERSION = "v1";

const Roles = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin"
};

const AccountStatus = {
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  AUTH_DELETED: "AUTH_DELETED"
};

module.exports = {
  USER_MANAGEMENT_VERSION,
  Roles,
  AccountStatus
};
