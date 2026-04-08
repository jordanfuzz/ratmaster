package com.ratmaster;

import com.google.gson.Gson;
import com.google.inject.Provides;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import net.runelite.api.Client;
import net.runelite.api.GameState;
import net.runelite.api.events.GameStateChanged;
import net.runelite.api.events.GameTick;
import net.runelite.api.events.VarbitChanged;
import net.runelite.client.callback.ClientThread;
import net.runelite.client.config.ConfigManager;
import net.runelite.client.eventbus.Subscribe;
import net.runelite.client.plugins.Plugin;
import net.runelite.client.plugins.PluginDescriptor;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import java.io.IOException;

@Slf4j
@PluginDescriptor(
	name = "Ratmaster",
	description = "Pushes Leagues task completions to the Ratmaster API",
	tags = {"leagues", "tasks", "tracker"}
)
public class RatmasterPlugin extends Plugin
{
	private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
	private static final long VARP_UPDATE_THROTTLE_MS = 3000;

	@Inject
	private Client client;

	@Inject
	private ClientThread clientThread;

	@Inject
	private RatmasterConfig config;

	@Inject
	private OkHttpClient httpClient;

	@Inject
	private Gson gson;

	private final Set<Integer> currentCompletedTaskIds = new HashSet<>();
	private final Set<String> currentUnlockedRegions = new HashSet<>();
	private final Set<Integer> pendingVarpIds = new HashSet<>();
	private long lastVarpFlush = 0;
	private boolean needsFullSync = false;
	private boolean loggedIn = false;

	@Provides
	RatmasterConfig provideConfig(ConfigManager configManager)
	{
		return configManager.getConfig(RatmasterConfig.class);
	}

	@Override
	protected void startUp()
	{
		log.info("Ratmaster plugin started");
	}

	@Override
	protected void shutDown()
	{
		log.info("Ratmaster plugin stopped");
		currentCompletedTaskIds.clear();
		currentUnlockedRegions.clear();
		pendingVarpIds.clear();
		loggedIn = false;
	}

	@Subscribe
	public void onGameStateChanged(GameStateChanged event)
	{
		if (event.getGameState() == GameState.LOGGED_IN && !loggedIn)
		{
			loggedIn = true;
			needsFullSync = true;
		}
		else if (event.getGameState() == GameState.LOGIN_SCREEN)
		{
			loggedIn = false;
		}
	}

	@Subscribe
	public void onVarbitChanged(VarbitChanged event)
	{
		if (!loggedIn || TaskData.TASK_VARPS.isEmpty())
		{
			return;
		}

		int varpId = event.getVarpId();
		if (TaskData.TASK_VARPS.contains(varpId))
		{
			pendingVarpIds.add(varpId);
		}
	}

	@Subscribe
	public void onGameTick(GameTick event)
	{
		if (!loggedIn)
		{
			return;
		}

		if (needsFullSync)
		{
			needsFullSync = false;
			clientThread.invoke(this::readFullStateAndSync);
			return;
		}

		if (!pendingVarpIds.isEmpty() &&
			System.currentTimeMillis() - lastVarpFlush > VARP_UPDATE_THROTTLE_MS)
		{
			Set<Integer> toFlush = new HashSet<>(pendingVarpIds);
			pendingVarpIds.clear();
			lastVarpFlush = System.currentTimeMillis();
			clientThread.invoke(() -> flushVarpUpdates(toFlush));
		}
	}

	private void readFullStateAndSync()
	{
		Set<Integer> completedIds = readAllCompletedTaskIds();
		Set<String> regions = readUnlockedRegions();

		currentCompletedTaskIds.clear();
		currentCompletedTaskIds.addAll(completedIds);
		currentUnlockedRegions.clear();
		currentUnlockedRegions.addAll(regions);

		Map<String, Object> body = new HashMap<>();
		body.put("completedTaskIds", new ArrayList<>(completedIds));
		body.put("unlockedRegions", new ArrayList<>(regions));

		postToApi("/api/sync", body);
	}

	private void flushVarpUpdates(Set<Integer> varpIds)
	{
		List<Integer> newlyCompleted = new ArrayList<>();
		List<String> newlyUnlocked = new ArrayList<>();

		for (int varpId : varpIds)
		{
			int varpIndex = TaskData.TASK_VARPS.indexOf(varpId);
			if (varpIndex < 0)
			{
				continue;
			}

			int varpValue = client.getVarpValue(varpId);
			BigInteger bits = BigInteger.valueOf(varpValue);

			for (int bit = 0; bit < 32; bit++)
			{
				int taskId = varpIndex * 32 + bit;
				if (bits.testBit(bit) && !currentCompletedTaskIds.contains(taskId))
				{
					currentCompletedTaskIds.add(taskId);
					newlyCompleted.add(taskId);
					log.info("Task {} newly completed", taskId);
				}
			}
		}

		// Also check region varbits
		Set<String> regions = readUnlockedRegions();
		for (String region : regions)
		{
			if (!currentUnlockedRegions.contains(region))
			{
				currentUnlockedRegions.add(region);
				newlyUnlocked.add(region);
				log.info("Region {} newly unlocked", region);
			}
		}

		if (!newlyCompleted.isEmpty() || !newlyUnlocked.isEmpty())
		{
			Map<String, Object> body = new HashMap<>();
			body.put("newlyCompletedTaskIds", newlyCompleted);
			body.put("newlyUnlockedRegions", newlyUnlocked);
			postToApi("/api/update", body);
		}
	}

	private Set<Integer> readAllCompletedTaskIds()
	{
		Set<Integer> completed = new HashSet<>();
		for (int varpIndex = 0; varpIndex < TaskData.TASK_VARPS.size(); varpIndex++)
		{
			int varpId = TaskData.TASK_VARPS.get(varpIndex);
			int varpValue = client.getVarpValue(varpId);
			BigInteger bits = BigInteger.valueOf(varpValue);

			for (int bit = 0; bit < 32; bit++)
			{
				if (bits.testBit(bit))
				{
					int taskId = varpIndex * 32 + bit;
					completed.add(taskId);
				}
			}
		}
		return completed;
	}

	private Set<String> readUnlockedRegions()
	{
		Set<String> regions = new HashSet<>();
		for (int i = 0; i < TaskData.REGION_VARBITS.size() && i < TaskData.REGION_NAMES.size(); i++)
		{
			int varbitId = TaskData.REGION_VARBITS.get(i);
			int value = client.getVarbitValue(varbitId);
			if (value > 0)
			{
				regions.add(TaskData.REGION_NAMES.get(i));
			}
		}
		return regions;
	}

	private void postToApi(String path, Map<String, Object> body)
	{
		String baseUrl = config.apiBaseUrl();
		String token = config.authToken();

		if (baseUrl.isEmpty() || token.isEmpty())
		{
			log.warn("Ratmaster API URL or auth token not configured");
			return;
		}

		String url = baseUrl.replaceAll("/+$", "") + path;
		String json = gson.toJson(body);

		Request request = new Request.Builder()
			.url(url)
			.addHeader("Authorization", "Bearer " + token)
			.post(RequestBody.create(JSON, json))
			.build();

		httpClient.newCall(request).enqueue(new Callback()
		{
			@Override
			public void onFailure(Call call, IOException e)
			{
				log.error("Ratmaster API request failed: {}", path, e);
			}

			@Override
			public void onResponse(Call call, Response response)
			{
				try
				{
					if (!response.isSuccessful())
					{
						log.warn("Ratmaster API returned {}: {}", response.code(), response.body().string());
					}
					else
					{
						log.debug("Ratmaster API {} success", path);
					}
				}
				catch (IOException e)
				{
					log.error("Error reading API response", e);
				}
				finally
				{
					response.close();
				}
			}
		});
	}
}
