package com.ratmaster;

import net.runelite.client.config.Config;
import net.runelite.client.config.ConfigGroup;
import net.runelite.client.config.ConfigItem;

@ConfigGroup("ratmaster")
public interface RatmasterConfig extends Config
{
	@ConfigItem(
		position = 1,
		keyName = "apiBaseUrl",
		name = "API Base URL",
		description = "Base URL for the Ratmaster API (e.g. https://ratmaster.example.com)"
	)
	default String apiBaseUrl()
	{
		return "http://localhost:3000";
	}

	@ConfigItem(
		position = 2,
		keyName = "authToken",
		name = "Auth Token",
		description = "Your personal auth token for the Ratmaster API",
		secret = true
	)
	default String authToken()
	{
		return "";
	}
}
