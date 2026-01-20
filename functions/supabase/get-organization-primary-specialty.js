const { SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const { createClient } = require("@supabase/supabase-js");
const supabase =
  SUPABASE_DATABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      })
    : null;

/**
 * Get the primary specialty for an organization
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object|null>} - The primary specialty or null if not found
 */
async function getOrganizationPrimarySpecialty(organizationId) {
  try {
    const { data, error } = await supabase
      .from("organization_specialties")
      .select(
        `
        specialty_id,
        specialties (
          id,
          name
        )
      `
      )
      .eq("organization_id", organizationId)
      .eq("is_primary", true)
      .single();

    if (error) {
      console.error("Error fetching primary specialty:", error);
      return null;
    }

    return data?.specialties || null;
  } catch (error) {
    console.error("Error in getOrganizationPrimarySpecialty:", error);
    return null;
  }
}

/**
 * Check if an organization has a primary specialty
 * @param {string} organizationId - The organization ID
 * @returns {Promise<boolean>} - True if organization has a primary specialty
 */
async function hasPrimarySpecialty(organizationId) {
  try {
    const { count, error } = await supabase
      .from("organization_specialties")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_primary", true);

    if (error) {
      console.error("Error checking primary specialty:", error);
      return false;
    }

    return count > 0;
  } catch (error) {
    console.error("Error in hasPrimarySpecialty:", error);
    return false;
  }
}

/**
 * Check if an organization should have "all access" mode
 * This is equivalent to the old chosen_specialty = 'all' behavior
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Object>} - Object with access mode and details
 */
async function getOrganizationAccessMode(organizationId) {
  try {
    const { data, error } = await supabase
      .from("organization_specialties")
      .select(
        `
        specialty_id,
        is_primary,
        specialties (
          id,
          name
        )
      `
      )
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error fetching organization specialties:", error);
      return {
        accessMode: "restricted",
        hasMultipleSpecialties: false,
        hasPrimarySpecialty: false,
      };
    }

    const orgSpecialties = data || [];
    const hasMultipleSpecialties = orgSpecialties.length > 1;
    const hasPrimarySpecialty = orgSpecialties.some((s) => s.is_primary);

    let accessMode = "restricted";
    let primarySpecialtyName = null;

    if (hasPrimarySpecialty) {
      const primarySpecialty = orgSpecialties.find((s) => s.is_primary);
      primarySpecialtyName = primarySpecialty.specialties.name;
      accessMode = "primary_specialty";
    } else if (hasMultipleSpecialties) {
      // This is the "all access" mode - equivalent to old 'all' value
      primarySpecialtyName = "all";
      accessMode = "all_specialties";
    } else if (orgSpecialties.length === 1) {
      // Only one specialty available
      primarySpecialtyName = orgSpecialties[0].specialties.name;
      accessMode = "single_specialty";
    }

    return {
      accessMode,
      primarySpecialtyName,
      hasMultipleSpecialties,
      hasPrimarySpecialty,
      totalSpecialties: orgSpecialties.length,
    };
  } catch (error) {
    console.error("Error in getOrganizationAccessMode:", error);
    return {
      accessMode: "restricted",
      hasMultipleSpecialties: false,
      hasPrimarySpecialty: false,
    };
  }
}

/**
 * Get all specialties an organization has access to
 * @param {string} organizationId - The organization ID
 * @returns {Promise<Array>} - Array of specialty objects
 */
async function getOrganizationSpecialties(organizationId) {
  try {
    const { data, error } = await supabase
      .from("organization_specialties")
      .select(
        `
        specialty_id,
        is_primary,
        specialties (
          id,
          name
        )
      `
      )
      .eq("organization_id", organizationId);

    if (error) {
      console.error("Error fetching organization specialties:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getOrganizationSpecialties:", error);
    return [];
  }
}

module.exports = {
  getOrganizationPrimarySpecialty,
  hasPrimarySpecialty,
  getOrganizationAccessMode,
  getOrganizationSpecialties,
};
