export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
	public: {
		Tables: {
			illustrations: {
				Row: {
					created_at: string;
					default_illustration: boolean;
					id: string;
					illustration_aliases: string[] | null;
					name: string;
					src: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					default_illustration?: boolean;
					id?: string;
					illustration_aliases?: string[] | null;
					name: string;
					src: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					default_illustration?: boolean;
					id?: string;
					illustration_aliases?: string[] | null;
					name?: string;
					src?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			rate_limits: {
				Row: {
					count: number;
					key: string;
					window_start: string;
				};
				ComputedFields: never;
				Insert: {
					count?: number;
					key: string;
					window_start: string;
				};
				Update: {
					count?: number;
					key?: string;
					window_start?: string;
				};
				Relationships: [];
			};
			session_policies: {
				Row: {
					created_at: string;
					last_seen_at: string;
					mode: Database['public']['Enums']['session_mode'];
					recovery_verified_at: string | null;
					session_id: string;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					last_seen_at?: string;
					mode: Database['public']['Enums']['session_mode'];
					recovery_verified_at?: string | null;
					session_id: string;
					user_id: string;
				};
				Update: {
					created_at?: string;
					last_seen_at?: string;
					mode?: Database['public']['Enums']['session_mode'];
					recovery_verified_at?: string | null;
					session_id?: string;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'session_policies_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			specialties: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			specialty_sub_specialties: {
				Row: {
					created_at: string;
					ordering: number;
					specialty_id: string;
					sub_specialty_id: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					ordering?: number;
					specialty_id: string;
					sub_specialty_id: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					ordering?: number;
					specialty_id?: string;
					sub_specialty_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'specialty_sub_specialties_specialty_id_fkey';
						columns: ['specialty_id'];
						isOneToOne: false;
						referencedRelation: 'specialties';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'specialty_sub_specialties_sub_specialty_id_fkey';
						columns: ['sub_specialty_id'];
						isOneToOne: false;
						referencedRelation: 'sub_specialties';
						referencedColumns: ['id'];
					}
				];
			};
			sub_specialties: {
				Row: {
					created_at: string;
					id: string;
					name: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					id?: string;
					name: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					name?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			sub_specialty_illustrations: {
				Row: {
					created_at: string;
					illustration_id: string;
					ordering: number;
					sub_specialty_id: string;
					updated_at: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					illustration_id: string;
					ordering?: number;
					sub_specialty_id: string;
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					illustration_id?: string;
					ordering?: number;
					sub_specialty_id?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'sub_specialty_illustrations_illustration_id_fkey';
						columns: ['illustration_id'];
						isOneToOne: false;
						referencedRelation: 'illustrations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'sub_specialty_illustrations_sub_specialty_id_fkey';
						columns: ['sub_specialty_id'];
						isOneToOne: false;
						referencedRelation: 'sub_specialties';
						referencedColumns: ['id'];
					}
				];
			};
			user_app_states: {
				Row: {
					selected_illustration_id: string | null;
					selected_specialty_id: string | null;
					selected_sub_specialty_id: string | null;
					user_id: string;
				};
				ComputedFields: never;
				Insert: {
					selected_illustration_id?: string | null;
					selected_specialty_id?: string | null;
					selected_sub_specialty_id?: string | null;
					user_id: string;
				};
				Update: {
					selected_illustration_id?: string | null;
					selected_specialty_id?: string | null;
					selected_sub_specialty_id?: string | null;
					user_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'user_app_states_selected_illustration_id_fkey';
						columns: ['selected_illustration_id'];
						isOneToOne: false;
						referencedRelation: 'illustrations';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'user_app_states_selected_specialty_id_fkey';
						columns: ['selected_specialty_id'];
						isOneToOne: false;
						referencedRelation: 'specialties';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'user_app_states_selected_sub_specialty_id_fkey';
						columns: ['selected_sub_specialty_id'];
						isOneToOne: false;
						referencedRelation: 'sub_specialties';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'user_app_states_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: true;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
			users: {
				Row: {
					auth_id: string;
					created_at: string;
					id: string;
				};
				ComputedFields: never;
				Insert: {
					auth_id: string;
					created_at?: string;
					id?: string;
				};
				Update: {
					auth_id?: string;
					created_at?: string;
					id?: string;
				};
				Relationships: [];
			};
			workspace_members: {
				Row: {
					created_at: string;
					role: Database['public']['Enums']['workspace_role'];
					user_id: string;
					workspace_id: string;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					role: Database['public']['Enums']['workspace_role'];
					user_id: string;
					workspace_id: string;
				};
				Update: {
					created_at?: string;
					role?: Database['public']['Enums']['workspace_role'];
					user_id?: string;
					workspace_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'workspace_members_user_id_fkey';
						columns: ['user_id'];
						isOneToOne: false;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					},
					{
						foreignKeyName: 'workspace_members_workspace_id_fkey';
						columns: ['workspace_id'];
						isOneToOne: false;
						referencedRelation: 'workspaces';
						referencedColumns: ['id'];
					}
				];
			};
			workspaces: {
				Row: {
					created_at: string;
					id: string;
					kind: Database['public']['Enums']['workspace_kind'];
					name: string | null;
					personal_owner_id: string | null;
				};
				ComputedFields: never;
				Insert: {
					created_at?: string;
					id?: string;
					kind?: Database['public']['Enums']['workspace_kind'];
					name?: string | null;
					personal_owner_id?: string | null;
				};
				Update: {
					created_at?: string;
					id?: string;
					kind?: Database['public']['Enums']['workspace_kind'];
					name?: string | null;
					personal_owner_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'workspaces_personal_owner_id_fkey';
						columns: ['personal_owner_id'];
						isOneToOne: true;
						referencedRelation: 'users';
						referencedColumns: ['id'];
					}
				];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			ensure_account: {
				Args: { p_auth_id: string };
				Returns: {
					auth_id: string;
					created_at: string;
					id: string;
				};
				SetofOptions: {
					from: '*';
					to: 'users';
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			export_account: { Args: { p_auth_id: string }; Returns: Json };
			purge_expired_sessions: { Args: Record<PropertyKey, never>; Returns: number };
			purge_rate_limits: { Args: Record<PropertyKey, never>; Returns: number };
			purge_unconfirmed_signups: { Args: Record<PropertyKey, never>; Returns: number };
			rate_limit_count: { Args: { p_key: string; p_window_seconds: number }; Returns: number };
			rate_limit_hit: { Args: { p_key: string; p_window_seconds: number }; Returns: number };
			rate_limit_window_start: { Args: { p_window_seconds: number }; Returns: string };
		};
		Enums: {
			session_mode: 'personal' | 'shared';
			workspace_kind: 'personal' | 'organization';
			workspace_role: 'owner' | 'member';
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
	TableName extends (DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never) = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
	EnumName extends (DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never) = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never) = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {
			session_mode: ['personal', 'shared'],
			workspace_kind: ['personal', 'organization'],
			workspace_role: ['owner', 'member']
		}
	}
} as const;
