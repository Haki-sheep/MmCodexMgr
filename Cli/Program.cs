using CodexInstanceManager;

return await AgentCli.RunAsync(args, Console.OpenStandardInput(), Console.OpenStandardOutput(), Console.Error, Environment.ProcessPath!, CancellationToken.None);
