// The illustration catalogue as /annotate receives it (2.3). Same shape as legacy
// `get-protected-content`, so the ported components (2.4) read it unchanged.

export interface Illustration {
	id: string;
	name: string;
	/** Cloudinary public ID; how it becomes a URL is G7 (2.4). */
	src: string;
	/** Other names the search also matches (`illustration_aliases`). */
	alias: string[];
	defaultIllustration: boolean;
}

export interface SubSpecialty {
	id: string;
	name: string;
	/** In catalogue order: `ordering`, then name. */
	illustrations: Illustration[];
}

export interface Specialty {
	id: string;
	name: string;
	/** In catalogue order: `ordering`, then name. */
	subSpecialties: SubSpecialty[];
}

/** Specialties by name. */
export type Catalogue = Specialty[];
