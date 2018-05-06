'use strict'

function getLength(buffer) {
	if (typeof('buffer') === 'string') return buffer.length;
	if (buffer instanceof Buffer) return buffer.byteLength;
	throw new Error("Unknown type!");
}

export default function write(stream, buffer) {
	const length = getLength(buffer);

	return new Promise((resolve, reject) => {
		let ok = true;
		ok = stream.write(buffer);
		if (ok) {
			resolve(length);
		} else {
			writer.once('drain', resolve.bind(null, length));
		}
	});
}