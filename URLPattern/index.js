/**
 * URLPattern - A utility for matching URL patterns similar to the native URLPattern API
 * This implementation provides a way to match URLs against patterns with path parameters and wildcards.
 */

class URLPattern {
	/**
	 * Creates a new URLPattern instance
	 * @param {Object|string} input - Input pattern as a string or object with protocol, username, password, hostname, port, pathname, search, hash properties
	 * @param {string} [baseURL] - Optional base URL to resolve against
	 */
	constructor(input, baseURL) {
		if (typeof input === 'string') {
			this.pattern = input;
			this.patternObj = this._parsePatternString(input);
		} else if (typeof input === 'object') {
			this.patternObj = {
				protocol: input.protocol || '*',
				username: input.username || '*',
				password: input.password || '*',
				hostname: input.hostname || '*',
				port: input.port || '*',
				pathname: input.pathname || '*',
				search: input.search || '*',
				hash: input.hash || '*'
			};
			this.pattern = this._buildPatternString(this.patternObj);
		}

		this.baseURL = baseURL;
		this._compileRegexPattern();
	}

	/**
	 * Parse a pattern string into components
	 * @param {string} patternString - The pattern string to parse
	 * @returns {Object} An object containing pattern components
	 * @private
	 */
	_parsePatternString(patternString) {
		try {
			const url = new URL(patternString);
			return {
				protocol: url.protocol.replace(':', ''),
				username: url.username || '*',
				password: url.password || '*',
				hostname: url.hostname,
				port: url.port || '*',
				pathname: url.pathname,
				search: url.search || '*',
				hash: url.hash || '*'
			};
		} catch (e) {
			// Handle cases where the pattern is not a complete URL
			// For simple path patterns
			return {
				protocol: '*',
				username: '*',
				password: '*',
				hostname: '*',
				port: '*',
				pathname: patternString.startsWith('/') ? patternString : `/${patternString}`,
				search: '*',
				hash: '*'
			};
		}
	}

	/**
	 * Build a pattern string from components
	 * @param {Object} patternObj - The pattern components
	 * @returns {string} The constructed pattern string
	 * @private
	 */
	_buildPatternString(patternObj) {
		if (patternObj.protocol === '*' && patternObj.hostname === '*') {
			// Return only pathname if it's a simple path pattern
			return patternObj.pathname;
		}

		let pattern = '';

		if (patternObj.protocol !== '*') {
			pattern += `${patternObj.protocol}://`;
		}

		if (patternObj.username !== '*' && patternObj.username) {
			pattern += patternObj.username;
			if (patternObj.password !== '*' && patternObj.password) {
				pattern += `:${patternObj.password}`;
			}
			pattern += '@';
		}

		if (patternObj.hostname !== '*') {
			pattern += patternObj.hostname;
		}

		if (patternObj.port !== '*' && patternObj.port) {
			pattern += `:${patternObj.port}`;
		}

		pattern += patternObj.pathname;

		if (patternObj.search !== '*' && patternObj.search) {
			pattern += patternObj.search;
		}

		if (patternObj.hash !== '*' && patternObj.hash) {
			pattern += patternObj.hash;
		}

		return pattern;
	}

	/**
	 * Compile the pattern into a regex for matching
	 * @private
	 */
	_compileRegexPattern() {
		// Convert the pattern to a regex pattern
		let regexPattern = this.patternObj.pathname;

		// We need to handle parameter replacements before escaping other characters

		// First, temporarily replace the parameters with a marker
		const params = [];
		let tempPattern = regexPattern.replace(/:[a-zA-Z0-9_]+/g, match => {
			params.push(match);
			return '___PARAM_MARKER___';
		});

		// Now escape special regex characters
		tempPattern = tempPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

		// Put the parameters back in, but converted to capture groups
		let paramIndex = 0;
		regexPattern = tempPattern.replace(/___PARAM_MARKER___/g, () => {
			return '([^/]+)'; // Each parameter becomes a capture group
		});

		// Replace wildcards * with regex patterns (but not \* escaped ones)
		regexPattern = regexPattern.replace(/(?<![\\])\*/g, '.*');

		// Add ^ and $ to match start and end of the string
		regexPattern = `^${regexPattern}$`;

		console.log('Final regex pattern:', regexPattern);
		// Use 'i' flag to make the regex case-insensitive
		this.regex = new RegExp(regexPattern, 'i');

		// Extract parameter names for later use
		this.paramNames = [];
		const paramMatches = this.patternObj.pathname.match(/:[a-zA-Z0-9_]+/g) || [];
		this.paramNames = paramMatches.map(param => param.substring(1));
	}

	/**
	 * Test if a URL matches the pattern
	 * @param {string|URL|Object} input - URL to test
	 * @returns {boolean} True if the URL matches the pattern
	 */
	test(input) {
		const urlObj = this._normalizeInput(input);
		const pathToTest = urlObj.pathname;

		// Quick path check - if the pathname doesn't match our regex, then return false
		if (!this.regex.test(pathToTest)) {
			return false;
		}

		// If specific hostname, protocol, etc. were specified, check those too
		if (this.patternObj.hostname !== '*' && urlObj.hostname !== this.patternObj.hostname) {
			return false;
		}

		if (this.patternObj.protocol !== '*' && urlObj.protocol.replace(':', '') !== this.patternObj.protocol) {
			return false;
		}

		// Add more component checks here if needed

		return true;
	}

	/**
	 * Execute the pattern against a URL and return match groups
	 * @param {string|URL|Object} input - URL to match against
	 * @returns {Object|null} Match result object or null if no match
	 */
	exec(input) {
		const urlObj = this._normalizeInput(input);
		const pathToTest = urlObj.pathname;

		console.log('Pattern regex:', this.regex);
		console.log('Testing path:', pathToTest);

		const match = this.regex.exec(pathToTest);
		if (!match) {
			console.log('No regex match found');
			return null;
		}

		// Check other url components like hostname, protocol, etc. if specified
		if (this.patternObj.hostname !== '*' && urlObj.hostname !== this.patternObj.hostname) {
			console.log('Hostname mismatch');
			return null;
		}

		if (this.patternObj.protocol !== '*' && urlObj.protocol.replace(':', '') !== this.patternObj.protocol) {
			console.log('Protocol mismatch');
			return null;
		}

		// Create result object with groups based on parameter names
		const result = {
			input: typeof input === 'string' ? input : urlObj.toString(),
			pathname: {
				input: pathToTest,
				groups: {}
			}
		};

		// Assign named parameter values
		this.paramNames.forEach((name, index) => {
			if (match[index + 1] !== undefined) {
				result.pathname.groups[name] = match[index + 1];
			}
		});

		console.log('Match result:', result);
		return result;
	}

	/**
	 * Normalize input to a URL object
	 * @param {string|URL|Object} input - URL input
	 * @returns {URL} Normalized URL object
	 * @private
	 */
	_normalizeInput(input) {
		if (typeof input === 'string') {
			// For simple path patterns like '/users/123', we'll treat them as paths
			if (input.startsWith('/')) {
				try {
					// Try to create a URL with the given base
					if (this.baseURL) {
						return new URL(input, this.baseURL);
					} else {
						// Create a URL with a dummy base
						const url = new URL(input, 'http://example.com');
						return url;
					}
				} catch (e) {
					console.error('Error normalizing path input:', e);
					// If that fails, fall back to our dummy URL
					return new URL(input, 'http://example.com');
				}
			}

			// For full URLs, try to parse them directly
			try {
				return new URL(input);
			} catch (e) {
				// If that fails, try with base URL
				try {
					if (this.baseURL) {
						return new URL(input, this.baseURL);
					}
				} catch (e2) {
					// Final fallback
					console.log('Falling back to example domain for:', input);
					return new URL(input.startsWith('/') ? input : `/${input}`, 'http://example.com');
				}
			}
		} else if (input instanceof URL) {
			return input;
		} else if (typeof input === 'object') {
			// Construct URL from parts
			let urlString = '';

			if (input.protocol) {
				urlString += `${input.protocol}://`;
			} else {
				urlString += 'http://';
			}

			if (input.username) {
				urlString += input.username;
				if (input.password) {
					urlString += `:${input.password}`;
				}
				urlString += '@';
			}

			urlString += input.hostname || 'example.com';

			if (input.port) {
				urlString += `:${input.port}`;
			}

			urlString += input.pathname || '/';

			if (input.search) {
				urlString += input.search;
			}

			if (input.hash) {
				urlString += input.hash;
			}

			console.log('Constructed URL string:', urlString);
			return new URL(urlString);
		}

		throw new TypeError('Invalid URL or URL-like object');
	}

	/**
	 * Match a URL against this pattern and return match groups
	 * @param {string|URL|Object} input - URL to match
	 * @returns {Object|null} Match result or null if no match
	 */
	match(input) {
		return this.exec(input);
	}

	/**
	 * Check if a path includes a route pattern
	 * @param {Object} parent - Parent route object
	 * @param {string} url - URL to check
	 * @returns {boolean} True if the URL is in the parent's children routes
	 */
	static isUrlInChildren(parent, url) {
		if (!parent.children) {
			return false;
		}

		for (let i = 0; i < parent.children.length; i++) {
			if (parent.children[i].children) {
				if (URLPattern.isUrlInChildren(parent.children[i], url)) {
					return true;
				}
			}

			if (parent.children[i].url === url || url.includes(parent.children[i].url)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Match a URL against a string pattern
	 * @param {string} url - URL to test
	 * @param {string} pattern - Pattern to match against
	 * @returns {boolean} True if the URL matches the pattern
	 */
	static matchPattern(url, pattern) {
		// Convert pattern string to regex
		let regexPattern = pattern
			// Convert route pattern params to regex capture groups
			.replace(/:[a-zA-Z0-9_]+/g, '([^/]+)')
			// Handle wildcard asterisks
			.replace(/\*/g, '.*')
			// Escape special regex chars
			.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1');

		// Create regex with start/end anchors and case-insensitive flag 'i'
		const regex = new RegExp(`^${regexPattern}$`, 'i');
		return regex.test(url);
	}

	/**
	 * Check if a URL matches a regex pattern
	 * @param {string} url - URL to test
	 * @param {RegExp|string} matchRegex - Regex pattern to match against
	 * @returns {boolean} True if the URL matches the pattern
	 */
	static matchRegex(url, matchRegex) {
		if (typeof matchRegex === 'string') {
			// Convert simple glob patterns to regex
			matchRegex = matchRegex
				.replace(/:[a-zA-Z0-9_]+/g, '([^/]+)')
				.replace(/\*/g, '.*')
				.replace(/([.+?^=!:${}()|\[\]\/\\])/g, '\\$1');

			// Add case-insensitive flag 'i'
			const regex = new RegExp(`^${matchRegex}$`, 'i');
			return regex.test(url);
		}

		if (matchRegex instanceof RegExp) {
			// If user provided a RegExp object, we respect their flags
			// but make a new one with case-insensitivity if it wasn't set
			if (!matchRegex.flags.includes('i')) {
				const newRegex = new RegExp(matchRegex.source, matchRegex.flags + 'i');
				return newRegex.test(url);
			}
			return matchRegex.test(url);
		}

		return false;
	}

	/**
	 * Check if a URL needs to be opened based on a pattern
	 * @param {string} pathname - Current pathname
	 * @param {Object} item - Route item object
	 * @returns {boolean} True if the path needs to be opened
	 */
	static needsToBeOpened(pathname, item) {
		return pathname && URLPattern.isUrlInChildren(item, pathname);
	}
}

export default URLPattern;
