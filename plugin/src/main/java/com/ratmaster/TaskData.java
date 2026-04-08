package com.ratmaster;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Stubbed task varps and region varbits for Leagues VI.
 * Replace these arrays with real values from the task-json-store
 * once Leagues VI (Demonic Pacts) is live.
 */
public class TaskData
{
	/**
	 * VarPlayer IDs that store task completion bits.
	 * Each VarPlayer stores 32 task completion flags as bits.
	 * Task ID maps to: varps[taskId / 32], bit (taskId % 32).
	 *
	 * STUB: empty until launch day data is available.
	 */
	public static final List<Integer> TASK_VARPS = Collections.unmodifiableList(
		Arrays.asList(
			// Populate with real VarPlayer IDs on launch day
		)
	);

	/**
	 * Varbit IDs for region unlock state.
	 * Each varbit corresponds to one unlockable region.
	 *
	 * STUB: empty until launch day data is available.
	 */
	public static final List<Integer> REGION_VARBITS = Collections.unmodifiableList(
		Arrays.asList(
			// Populate with real varbit IDs on launch day
		)
	);

	/**
	 * Region names corresponding to REGION_VARBITS indices.
	 * Must be kept in sync with REGION_VARBITS.
	 */
	public static final List<String> REGION_NAMES = Collections.unmodifiableList(
		Arrays.asList(
			// Populate on launch day, e.g.:
			// "Asgarnia", "Desert", "Fremennik", "Kandarin",
			// "Kourend", "Morytania", "Tirannwn", "Varlamore", "Wilderness"
		)
	);
}
