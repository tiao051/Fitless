using System;
using System.IO;

namespace Fitly.API.Utilities
{
    public static class FileLogger
    {
        private static readonly string LogDirectory = Path.Combine("/app", "logs", "api");
        private static readonly string LogFile = Path.Combine(LogDirectory, "app.log");

        static FileLogger()
        {
            // Create logs directory if it doesn't exist
            try
            {
                if (!Directory.Exists(LogDirectory))
                {
                    Directory.CreateDirectory(LogDirectory);
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"Failed to create log directory: {ex.Message}");
            }
        }

        public static void Log(string message)
        {
            try
            {
                var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
                var logMessage = $"[{timestamp}] {message}\n";
                File.AppendAllText(LogFile, logMessage);
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"Failed to write log: {ex.Message}");
            }
        }

        public static void LogError(string message, Exception ex = null)
        {
            var errorMsg = ex != null 
                ? $"{message} - {ex.GetType().Name}: {ex.Message}" 
                : message;
            if (ex?.InnerException != null)
            {
                errorMsg += $" | InnerException: {ex.InnerException.Message}";
            }
            Log($"[ERROR] {errorMsg}");
        }

        public static void LogInfo(string message)
        {
            Log($"[INFO] {message}");
        }

        public static void LogWarning(string message)
        {
            Log($"[WARN] {message}");
        }
    }
}
