
import '@testing-library/jest-dom';

if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage?.clear !== 'function') {
	const localStorageMock = (() => {
		let store: Record<string, string> = {};
		return {
			getItem: (key: string) => (key in store ? store[key] : null),
			setItem: (key: string, value: string) => {
				store[key] = String(value);
			},
			removeItem: (key: string) => {
				delete store[key];
			},
			clear: () => {
				store = {};
			},
			key: (index: number) => Object.keys(store)[index] ?? null,
			get length() {
				return Object.keys(store).length;
			},
		} as Storage;
	})();

	Object.defineProperty(globalThis, 'localStorage', {
		value: localStorageMock,
		writable: true,
	});
}
