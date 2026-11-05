import type { SelectionIds } from '../../catalogue/selection';
import { adminClient } from '../supabase';

/**
 * The caller's /annotate state (`user_app_states`, data-model §3.2). Always keyed by the
 * `locals.profile.userId` the guard gives; never by an id from the request (auth-spec §7.1).
 */

export async function loadAppState(userId: string): Promise<SelectionIds> {
	const { data, error } = await adminClient()
		.from('user_app_states')
		.select('selected_specialty_id, selected_sub_specialty_id, selected_illustration_id')
		.eq('user_id', userId)
		.maybeSingle();
	if (error) throw new Error('app state lookup failed', { cause: error });
	return {
		specialtyId: data?.selected_specialty_id ?? null,
		subSpecialtyId: data?.selected_sub_specialty_id ?? null,
		illustrationId: data?.selected_illustration_id ?? null
	};
}

/** Writes the whole selection. An upsert, in case the row went missing (`ensure_account` makes it). */
export async function saveAppState(userId: string, ids: SelectionIds): Promise<void> {
	const { error } = await adminClient().from('user_app_states').upsert(
		{
			user_id: userId,
			selected_specialty_id: ids.specialtyId,
			selected_sub_specialty_id: ids.subSpecialtyId,
			selected_illustration_id: ids.illustrationId
		},
		{ onConflict: 'user_id' }
	);
	if (error) throw new Error('app state save failed', { cause: error });
}
