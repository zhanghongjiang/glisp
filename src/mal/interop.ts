import {MalError} from './types'

export default {
	resolveJS(str: string): [any, any] {
		if (str.match(/\./)) {
			// eslint-disable-next-line no-useless-escape
			const match = /^(.*)\.[^\.]*$/.exec(str)

			if (match === null) {
				throw new MalError('[interop.resolveJS] Cannot resolve')
			} else {
				return [eval(match[1]), eval(str)]
			}
		} else {
			return [globalThis, eval(str)]
		}
	},

	jsToMal(obj: any) {
		if (obj === null || obj === undefined) {
			return null
		}

		const cache: any[] = []

		const str = JSON.stringify(obj, (key, value) => {
			if (typeof value === 'object' && value !== null) {
				if (cache.indexOf(value) !== -1) {
					// Circular reference found, discard key
					return
				}
				// Store value in our collection
				cache.push(value)
			}
			return value
		})

		return JSON.parse(str)
	}
}
