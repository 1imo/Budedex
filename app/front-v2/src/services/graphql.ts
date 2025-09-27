const API_BASE_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:4002';

async function gqlRequest(query: string, variables: any = {}, token?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    console.log(`🔗 API Request to: ${API_BASE_URL}/api/gql`);
    
    const res = await fetch(`${API_BASE_URL}/api/gql`, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`❌ GraphQL request failed: ${res.status} ${res.statusText}`, errorText);
      throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
    }

    const result = await res.json();

    if (result.errors) {
      console.error('❌ GraphQL errors:', result.errors);
      throw new Error(result.errors[0]?.message || "GraphQL error occurred");
    }

    console.log('✅ GraphQL request successful');
    return result.data;
  } catch (error) {
    console.error('❌ Network or parsing error:', error);
    throw error;
  }
}

export async function getStrains(page: number, limit: number, token?: string) {
  const query = `
    query GetStrains($page: Int!, $limit: Int!) {
      strains(page: $page, limit: $limit) {
        strains {
          strain_id
          name
          url
          type
          thc
          cbd
          rating
          review_count
          top_effect
          category
          image_path
          image_url
          description
          aliases
          positive_effects
          negative_effects
          flavors
          terpenes
          medical_benefits
          parents
          children
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
          total
        }
      }
    }
  `;
  return gqlRequest(query, { page, limit }, token);
}

export async function getStrain(name: string, token?: string) {
  const query = `
    query GetStrain($name: String!) {
      strain(name: $name) {
        name
        url
        type
        thc
        cbd
        rating
        review_count
        top_effect
        category
        image_path
        image_url
        description
        aliases
        positive_effects
        negative_effects
        flavors
        terpenes
        medical_benefits
        parents
        children
      }
    }
  `;
  return gqlRequest(query, { name }, token);
}

export async function searchStrains(query: string, page: number, limit: number, token?: string) {
  const gqlQuery = `
    query SearchStrains($query: String!, $page: Int!, $limit: Int!) {
      searchStrains(query: $query, page: $page, limit: $limit) {
        strains {
          name
          url
          type
          thc
          cbd
          rating
          review_count
          top_effect
          category
          image_path
          image_url
          description
          positive_effects
          negative_effects
          flavors
          terpenes
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          currentPage
          totalPages
          total
        }
      }
    }
  `;
  return gqlRequest(gqlQuery, { query, page, limit }, token);
}

export async function searchExact(query: string, token?: string) {
  const gqlQuery = `
    query SearchExact($query: String!) {
      searchExact(query: $query) {
        strain_id
        name
        url
        type
        thc
        cbd
        rating
        review_count
        top_effect
        category
        image_path
        image_url
        description
        aliases
        positive_effects
        negative_effects
        flavors
        terpenes
        medical_benefits
        parents
        children
      }
    }
  `;
  return gqlRequest(gqlQuery, { query }, token);
}