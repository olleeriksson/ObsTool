using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using ObsTool.Database;

namespace ObsTool.Migrations
{
    [DbContext(typeof(MainDbContext))]
    [Migration("20260520000000_AddUsers")]
    public partial class AddUsers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use provider-specific SQL because this migration must run on both local SQLite and hosted MySQL.
            if (IsMySql(migrationBuilder))
            {
                migrationBuilder.Sql(@"
CREATE TABLE `Users` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Email` varchar(320) NOT NULL,
    `NormalizedEmail` varchar(320) NOT NULL,
    `Username` varchar(100) NULL,
    `NormalizedUsername` varchar(100) NULL,
    `FullName` varchar(200) NOT NULL,
    `PasswordHash` longtext NOT NULL,
    `EmailConfirmed` tinyint(1) NOT NULL,
    `EmailConfirmationTokenHash` varchar(128) NULL,
    `EmailConfirmationTokenExpiresUtc` datetime(6) NULL,
    `PasswordResetTokenHash` varchar(128) NULL,
    `PasswordResetTokenExpiresUtc` datetime(6) NULL,
    `CreatedUtc` datetime(6) NOT NULL,
    `UpdatedUtc` datetime(6) NULL,
    `LastLoginUtc` datetime(6) NULL,
    CONSTRAINT `PK_Users` PRIMARY KEY (`Id`)
);");
                migrationBuilder.Sql(@"CREATE UNIQUE INDEX `IX_Users_NormalizedEmail` ON `Users` (`NormalizedEmail`);");
                migrationBuilder.Sql(@"CREATE UNIQUE INDEX `IX_Users_NormalizedUsername` ON `Users` (`NormalizedUsername`);");
                return;
            }

            migrationBuilder.Sql(@"
CREATE TABLE ""Users"" (
    ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Users"" PRIMARY KEY AUTOINCREMENT,
    ""Email"" TEXT NOT NULL,
    ""NormalizedEmail"" TEXT NOT NULL,
    ""Username"" TEXT NULL,
    ""NormalizedUsername"" TEXT NULL,
    ""FullName"" TEXT NOT NULL,
    ""PasswordHash"" TEXT NOT NULL,
    ""EmailConfirmed"" INTEGER NOT NULL,
    ""EmailConfirmationTokenHash"" TEXT NULL,
    ""EmailConfirmationTokenExpiresUtc"" TEXT NULL,
    ""PasswordResetTokenHash"" TEXT NULL,
    ""PasswordResetTokenExpiresUtc"" TEXT NULL,
    ""CreatedUtc"" TEXT NOT NULL,
    ""UpdatedUtc"" TEXT NULL,
    ""LastLoginUtc"" TEXT NULL
);");
            migrationBuilder.Sql(@"CREATE UNIQUE INDEX ""IX_Users_NormalizedEmail"" ON ""Users"" (""NormalizedEmail"");");
            migrationBuilder.Sql(@"CREATE UNIQUE INDEX ""IX_Users_NormalizedUsername"" ON ""Users"" (""NormalizedUsername"");");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            if (IsMySql(migrationBuilder))
            {
                migrationBuilder.Sql(@"DROP TABLE `Users`;");
                return;
            }

            migrationBuilder.Sql(@"DROP TABLE ""Users"";");
        }

        private static bool IsMySql(MigrationBuilder migrationBuilder)
        {
            return migrationBuilder.ActiveProvider?.ToLowerInvariant().Contains("mysql") == true;
        }
    }
}
