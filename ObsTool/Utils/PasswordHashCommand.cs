using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;

namespace ObsTool.Utils
{
    public static class PasswordHashCommand
    {
        private const string CommandName = "hash-password";

        public static bool IsHashPasswordCommand(string[] args)
        {
            return args.Any(arg => string.Equals(arg, CommandName, StringComparison.OrdinalIgnoreCase));
        }

        public static void Run(string[] args)
        {
            var password = GetPassword(args);
            if (string.IsNullOrEmpty(password))
            {
                throw new InvalidOperationException($"Missing password. Example: dotnet run --project ObsTool -- {CommandName} \"your-password\"");
            }

            var passwordHasher = new PasswordHasher<string>();
            Console.WriteLine(passwordHasher.HashPassword(null, password));
        }

        private static string GetPassword(string[] args)
        {
            var commandIndex = Array.FindIndex(args, arg => string.Equals(arg, CommandName, StringComparison.OrdinalIgnoreCase));
            return commandIndex >= 0 && commandIndex < args.Length - 1
                ? args[commandIndex + 1]
                : null;
        }
    }
}
