import { encrypt } from "./crypto";

export interface Project {
  id: string;
  name: string;
  domain: string;
  vercel_project_id: string | null;
  sanity_project_id: string | null;
  sanity_dataset: string;
  supabase_project_ref: string | null;
  encrypted_vercel_token: string | null;
  encrypted_sanity_token: string | null;
  encrypted_supabase_anon_key: string | null;
  encrypted_resend_api_key: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  role: "ADMIN" | "CLIENT";
  project_id: string | null;
  server_stats_access?: boolean;
  updated_at: string | null;
  email: string;
}

export interface AnalyticsEvent {
  id: string;
  project_id: string;
  path: string;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  timestamp: string;
}

// In-Memory Database Structure
interface DemoDatabase {
  projects: Project[];
  profiles: Profile[];
  events: AnalyticsEvent[];
}

const ACME_ID = "d48602b9-e137-4d6d-9653-568ea46a9a7d";
const ZENITH_ID = "7b2e105e-851f-4efc-8e8e-cbfb4db6d953";
const STELLAR_ID = "143fb207-6b6b-4e0a-b50a-f018e698888b";

const ADMIN_ID = "a1111111-1111-1111-1111-111111111111";
const ALICE_ID = "c2222222-2222-2222-2222-222222222222";
const ZACH_ID = "c3333333-3333-3333-3333-333333333333";

function generateSeedEvents(projectIds: string[]): AnalyticsEvent[] {
  const events: AnalyticsEvent[] = [];
  const paths = ["/", "/about", "/products", "/contact", "/blog/react-vs-nextjs", "/pricing", "/docs"];
  const referrers = ["https://google.com", "https://twitter.com", "https://github.com", "Direct", "https://news.ycombinator.com", "https://linkedin.com"];
  const browsers = ["Chrome", "Safari", "Firefox", "Edge"];
  const osList = ["Windows", "macOS", "iOS", "Android", "Linux"];
  const countries = ["US", "GB", "IN", "DE", "CA", "JP", "FR", "AU", "BR", "ZA"];

  const now = new Date();

  // Generate around 150 events per project spread across 14 days
  projectIds.forEach((projId) => {
    const numEvents = projId === ACME_ID ? 180 : projId === ZENITH_ID ? 240 : 90;
    for (let i = 0; i < numEvents; i++) {
      const daysAgo = Math.random() * 14;
      const eventTime = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      // Select path with weighted probabilities
      let path = paths[0];
      const r = Math.random();
      if (r > 0.4 && r <= 0.6) path = paths[1];
      else if (r > 0.6 && r <= 0.75) path = paths[2];
      else if (r > 0.75 && r <= 0.85) path = paths[3];
      else if (r > 0.85 && r <= 0.92) path = paths[4];
      else if (r > 0.92 && r <= 0.97) path = paths[5];
      else if (r > 0.97) path = paths[6];

      events.push({
        id: `evt-${Math.random().toString(36).substr(2, 9)}`,
        project_id: projId,
        path,
        referrer: referrers[Math.floor(Math.random() * referrers.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        os: osList[Math.floor(Math.random() * osList.length)],
        country: countries[Math.floor(Math.random() * countries.length)],
        timestamp: eventTime.toISOString(),
      });
    }
  });

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

const globalForDemo = global as unknown as { demoDb?: DemoDatabase };

if (!globalForDemo.demoDb) {
  const seedProjects: Project[] = [
    {
      id: ACME_ID,
      name: "Acme Portfolio",
      domain: "acme.com",
      vercel_project_id: "prj_acme123",
      sanity_project_id: "sanity_acme",
      sanity_dataset: "production",
      supabase_project_ref: "acme-supabase-ref",
      encrypted_vercel_token: encrypt("mock_vercel_token_acme"),
      encrypted_sanity_token: encrypt("mock_sanity_token_acme"),
      encrypted_supabase_anon_key: encrypt("mock_supabase_key_acme"),
      encrypted_resend_api_key: encrypt("mock_resend_key_acme"),
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: ZENITH_ID,
      name: "Zenith E-Commerce",
      domain: "zenith-shop.io",
      vercel_project_id: "prj_zenith99",
      sanity_project_id: "sanity_zenith",
      sanity_dataset: "production",
      supabase_project_ref: null,
      encrypted_vercel_token: encrypt("mock_vercel_token_zenith"),
      encrypted_sanity_token: encrypt("mock_sanity_token_zenith"),
      encrypted_supabase_anon_key: null,
      encrypted_resend_api_key: null,
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: STELLAR_ID,
      name: "Stellar Blog",
      domain: "stellar-blog.net",
      vercel_project_id: "prj_stellar",
      sanity_project_id: "sanity_stellar",
      sanity_dataset: "staging",
      supabase_project_ref: "stellar-supabase-ref",
      encrypted_vercel_token: encrypt("mock_vercel_token_stellar"),
      encrypted_sanity_token: encrypt("mock_sanity_token_stellar"),
      encrypted_supabase_anon_key: encrypt("mock_supabase_key_stellar"),
      encrypted_resend_api_key: null,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const seedProfiles: Profile[] = [
    {
      id: ADMIN_ID,
      email: "admin@dashboard.com",
      full_name: "Alex Admin",
      role: "ADMIN",
      project_id: null,
      server_stats_access: true,
      updated_at: new Date().toISOString(),
    },
    {
      id: ALICE_ID,
      email: "client-acme@dashboard.com",
      full_name: "Alice Acme",
      role: "CLIENT",
      project_id: ACME_ID,
      updated_at: new Date().toISOString(),
    },
    {
      id: ZACH_ID,
      email: "client-zenith@dashboard.com",
      full_name: "Zach Zenith",
      role: "CLIENT",
      project_id: ZENITH_ID,
      updated_at: new Date().toISOString(),
    },
  ];

  globalForDemo.demoDb = {
    projects: seedProjects,
    profiles: seedProfiles,
    events: generateSeedEvents([ACME_ID, ZENITH_ID, STELLAR_ID]),
  };
}

export const demoDb = globalForDemo.demoDb;

// Helper APIs for accessing/modifying the Mock DB
export const demoDbOperations = {
  getProjects: () => demoDb.projects,
  
  getProjectById: (id: string) => demoDb.projects.find((p) => p.id === id) || null,
  
  createProject: (proj: Omit<Project, "id" | "created_at">) => {
    const newProj: Project = {
      ...proj,
      id: `proj-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
    };
    demoDb.projects.push(newProj);
    return newProj;
  },

  updateProject: (id: string, updates: Partial<Project>) => {
    const idx = demoDb.projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    demoDb.projects[idx] = {
      ...demoDb.projects[idx],
      ...updates,
    };
    return demoDb.projects[idx];
  },

  deleteProject: (id: string) => {
    demoDb.projects = demoDb.projects.filter((p) => p.id !== id);
    demoDb.events = demoDb.events.filter((e) => e.project_id !== id);
    // Unlink users
    demoDb.profiles.forEach((p) => {
      if (p.project_id === id) p.project_id = null;
    });
    return true;
  },

  getProfiles: () => demoDb.profiles,

  getProfileByEmail: (email: string) => demoDb.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase()) || null,

  getProfileById: (id: string) => demoDb.profiles.find((p) => p.id === id) || null,

  createClientProfile: (email: string, fullName: string, projectId: string | null) => {
    const newProfile: Profile = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      email,
      full_name: fullName,
      role: "CLIENT",
      project_id: projectId,
      updated_at: new Date().toISOString(),
    };
    demoDb.profiles.push(newProfile);
    return newProfile;
  },

  createAdminProfile: (email: string, fullName: string, serverStatsAccess: boolean = false) => {
    const newProfile: Profile = {
      id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      email,
      full_name: fullName,
      role: "ADMIN",
      project_id: null,
      server_stats_access: serverStatsAccess,
      updated_at: new Date().toISOString(),
    };
    demoDb.profiles.push(newProfile);
    return newProfile;
  },

  deleteProfile: (id: string) => {
    demoDb.profiles = demoDb.profiles.filter((p) => p.id !== id);
    return true;
  },

  updateProfile: (id: string, updates: Partial<Profile>) => {
    const idx = demoDb.profiles.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    demoDb.profiles[idx] = {
      ...demoDb.profiles[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return demoDb.profiles[idx];
  },

  getAnalyticsEvents: (projectId: string) => demoDb.events.filter((e) => e.project_id === projectId),

  addAnalyticsEvent: (event: Omit<AnalyticsEvent, "id" | "timestamp">) => {
    const newEvent: AnalyticsEvent = {
      ...event,
      id: `evt-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    demoDb.events.unshift(newEvent);
    return newEvent;
  },

  // Mocking Real-Time Service Responses (Vercel & Sanity)
  getVercelStats: (projectId: string, token: string | null) => {
    const proj = demoDb.projects.find((p) => p.id === projectId);
    const vercelId = proj?.vercel_project_id || "unknown";
    
    // Check build statuses, quotas
    const builds = [
      { id: "dpl_1", status: "READY", url: `${vercelId}-dpl1.vercel.app`, branch: "main", commit: "feat: update dashboard hooks", creator: "Alex Admin", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: "dpl_2", status: "READY", url: `${vercelId}-dpl2.vercel.app`, branch: "main", commit: "fix: client validation layout", creator: "Alice Acme", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
      { id: "dpl_3", status: "ERROR", url: `${vercelId}-dpl3.vercel.app`, branch: "staging", commit: "test: experimental metrics drain", creator: "Alex Admin", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    ];

    // Seeded data sizes
    const bandwidthGb = proj?.id === ACME_ID ? 42.8 : proj?.id === ZENITH_ID ? 88.4 : 12.3;
    const executionTimeSec = proj?.id === ACME_ID ? 1240 : proj?.id === ZENITH_ID ? 3120 : 420;

    return {
      status: "ACTIVE",
      vercelProjectId: vercelId,
      deployments: builds,
      quota: {
        bandwidthUsedGb: bandwidthGb,
        bandwidthLimitGb: 100,
        serverlessTimeSeconds: executionTimeSec,
        serverlessLimitSeconds: 5000,
      }
    };
  },

  getSanityStats: (projectId: string, token: string | null) => {
    const proj = demoDb.projects.find((p) => p.id === projectId);
    const sanityId = proj?.sanity_project_id || "unknown";

    // Dataset document levels
    const documentsCount = proj?.id === ACME_ID ? 1850 : proj?.id === ZENITH_ID ? 8940 : 450;
    const documentsLimit = proj?.id === ZENITH_ID ? 50000 : 10000;
    const assetFootprintMb = proj?.id === ACME_ID ? 245 : proj?.id === ZENITH_ID ? 1420 : 64;
    const assetFootprintLimitMb = 5000;

    return {
      sanityProjectId: sanityId,
      dataset: proj?.sanity_dataset || "production",
      quota: {
        documentsUsed: documentsCount,
        documentsLimit,
        assetsUsedMb: assetFootprintMb,
        assetsLimitMb: assetFootprintLimitMb,
        apiRequestsUsed: proj?.id === ACME_ID ? 148200 : proj?.id === ZENITH_ID ? 890400 : 22000,
        apiRequestsLimit: 1000000,
      }
    };
  }
};
