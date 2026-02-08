import type { AppData } from '$lib/types';

const DEFAULT_DATA: AppData = {
	lists: {},
	currentList: null,
	version: '2.0.0'
};

/**
 * Trigger download of settings as a JSON file.
 */
export function exportSettings(data: AppData): void {
	const exportData = { ...data, version: data.version || '2.0.0' };
	const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'groupthing_settings.json';
	document.body.appendChild(a);
	a.click();

	setTimeout(() => {
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, 0);
}

/**
 * Read and validate a JSON settings file.
 */
export function importSettings(file: File): Promise<AppData> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = (event) => {
			try {
				const raw = event.target?.result;
				if (typeof raw !== 'string') {
					throw new Error('Failed to read file');
				}

				const imported = JSON.parse(raw) as Partial<AppData>;

				if (!imported.lists || typeof imported.lists !== 'object') {
					throw new Error('Invalid settings file: missing lists property');
				}

				const merged: AppData = {
					...DEFAULT_DATA,
					...imported,
					version: imported.version || DEFAULT_DATA.version
				};

				resolve(merged);
			} catch (error) {
				reject(error instanceof Error ? error : new Error('Invalid JSON file'));
			}
		};

		reader.onerror = () => reject(new Error('Error reading the file'));
		reader.readAsText(file);
	});
}
