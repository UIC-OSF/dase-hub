import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: 'us-east-2' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'dase-hub';

// ============ GITHUB CACHE (1 min TTL) ============
const CACHE_TTL_SECONDS = 60; // 1 minute

export interface GitHubCacheEntry {
    pk: string; // GHCACHE
    sk: string; // URL hash/key
    data: any;
    cachedAt: number; // Unix timestamp
    expiresAt: number; // Unix timestamp for TTL
}

// Create a simple hash for the URL to use as sort key
function hashUrl(url: string): string {
    // Simple hash - just use the URL path after api.github.com
    return url.replace('https://api.github.com/', '').replace(/[^a-zA-Z0-9]/g, '_');
}

// Get cached GitHub response
export async function getGitHubCache(url: string): Promise<any | null> {
    try {
        const sk = hashUrl(url);
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { 
                pk: 'GHCACHE',
                sk
            }
        }));
        
        if (!result.Item) return null;
        
        const entry = result.Item as GitHubCacheEntry;
        const now = Math.floor(Date.now() / 1000);
        
        // Check if cache is still valid
        if (entry.expiresAt < now) {
            return null; // Cache expired — caller should fetch fresh
        }
        
        // Reject cached error responses or empty arrays (bad data from rate limits)
        const data = entry.data;
        if (data?.message || data?.error || (Array.isArray(data) && data.length === 0)) {
            console.log(`[GHCACHE] REJECT bad cached data for ${url}`);
            return null;
        }
        
        console.log(`[GHCACHE] HIT for ${url}`);
        return entry.data;
    } catch (error) {
        console.error('Error getting GitHub cache:', error);
        return null;
    }
}

// Get stale cached data as a last resort (ignores expiry, rejects errors)
export async function getStaleGitHubCache(url: string): Promise<any | null> {
    try {
        const sk = hashUrl(url);
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { 
                pk: 'GHCACHE',
                sk
            }
        }));
        
        if (!result.Item) return null;
        
        const data = (result.Item as GitHubCacheEntry).data;
        
        // Still reject error responses — stale errors are useless
        if (data?.message || data?.error || (Array.isArray(data) && data.length === 0)) {
            return null;
        }
        
        console.log(`[GHCACHE] STALE HIT for ${url}`);
        return data;
    } catch (error) {
        console.error('Error getting stale GitHub cache:', error);
        return null;
    }
}

// Delete a cached GitHub response (used when GitHub returns 404 so a stale entry
// can't keep serving content that no longer exists upstream)
export async function deleteGitHubCache(url: string): Promise<void> {
    try {
        const sk = hashUrl(url);
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'GHCACHE', sk }
        }));
        console.log(`[GHCACHE] DELETE for ${url}`);
    } catch (error) {
        console.error('Error deleting GitHub cache:', error);
    }
}

// Set cached GitHub response
export async function setGitHubCache(url: string, data: any): Promise<void> {
    try {
        const sk = hashUrl(url);
        const now = Math.floor(Date.now() / 1000);
        
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: 'GHCACHE',
                sk,
                data,
                cachedAt: now,
                expiresAt: now + CACHE_TTL_SECONDS,
                ttl: now + (7 * 24 * 60 * 60) // Keep in DynamoDB for 7 days as stale fallback
            }
        }));
        console.log(`[GHCACHE] SET for ${url}`);
    } catch (error) {
        console.error('Error setting GitHub cache:', error);
    }
}

// ============ PRO USERS ============

export interface ProUser {
    pk: string; // USER
    sk: string; // <github_id>
    github_id: string;
    github_login: string;
    pro_since: string;
    status: 'active' | 'canceled' | 'past_due';
}

export async function getProUser(githubId: string): Promise<ProUser | null> {
    try {
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { 
                pk: 'USER',
                sk: githubId
            }
        }));
        return result.Item as ProUser || null;
    } catch (error) {
        console.error('Error getting pro user:', error);
        return null;
    }
}

export async function setProUser(user: Omit<ProUser, 'pk' | 'sk'>): Promise<boolean> {
    try {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: 'USER',
                sk: user.github_id,
                ...user
            }
        }));
        return true;
    } catch (error) {
        console.error('Error setting pro user:', error);
        return false;
    }
}

export async function updateProStatus(githubId: string, status: ProUser['status']): Promise<boolean> {
    const user = await getProUser(githubId);
    if (!user) return false;
    
    return setProUser({ ...user, status });
}

// Get count of active pro users
export async function getProUserCount(): Promise<number> {
    try {
        let count = 0;
        let lastKey: Record<string, any> | undefined;
        
        do {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk',
                FilterExpression: '#status = :active',
                ExpressionAttributeNames: {
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':pk': 'USER',
                    ':active': 'active'
                },
                Select: 'COUNT',
                ExclusiveStartKey: lastKey
            }));
            count += result.Count || 0;
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);
        
        return count;
    } catch (error) {
        console.error('Error getting pro user count:', error);
        return 0;
    }
}

export interface PageView {
    pk: string; // VIEW
    sk: string; // timestamp
    ip: string;
    country: string;
    region: string;
    city: string;
    device: string;
    os: string;
    path: string;
    userAgent: string;
}

function parseUserAgent(ua: string): { device: string; os: string } {
    const uaLower = ua.toLowerCase();
    
    // Detect OS
    let os = 'Unknown';
    if (uaLower.includes('iphone')) os = 'iOS';
    else if (uaLower.includes('ipad')) os = 'iPadOS';
    else if (uaLower.includes('android')) os = 'Android';
    else if (uaLower.includes('mac os')) os = 'macOS';
    else if (uaLower.includes('windows')) os = 'Windows';
    else if (uaLower.includes('linux')) os = 'Linux';
    else if (uaLower.includes('cros')) os = 'ChromeOS';
    
    // Detect device type
    let device = 'Desktop';
    if (uaLower.includes('mobile') || uaLower.includes('iphone') || uaLower.includes('android')) {
        device = 'Mobile';
    } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
        device = 'Tablet';
    } else if (uaLower.includes('bot') || uaLower.includes('crawler') || uaLower.includes('spider')) {
        device = 'Bot';
    }
    
    return { device, os };
}

export async function logView(headers: Record<string, string>, path: string): Promise<void> {
    try {
        // Get values from CloudFront headers (case-insensitive lookup)
        const getHeader = (name: string) => {
            const lower = name.toLowerCase();
            for (const [key, value] of Object.entries(headers)) {
                if (key.toLowerCase() === lower) return value;
            }
            return '';
        };
        
        const ip = getHeader('x-forwarded-for')?.split(',')[0]?.trim() || 
                   getHeader('cloudfront-viewer-address')?.split(':')[0] || 
                   'Unknown';
        const country = getHeader('cloudfront-viewer-country') || 'Unknown';
        const region = getHeader('cloudfront-viewer-country-region') || 'Unknown';
        const city = getHeader('cloudfront-viewer-city') || 'Unknown';
        const userAgent = getHeader('user-agent') || '';
        
        const { device, os } = parseUserAgent(userAgent);
        
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: 'VIEW',
                sk: new Date().toISOString(),
                ip,
                country,
                region,
                city,
                device,
                os,
                path,
                userAgent
            }
        }));
    } catch (error) {
        console.error('Error logging view:', error);
    }
}

// Get view count for last 24 hours
export async function getTodayViewCount(): Promise<number> {
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
        let totalCount = 0;
        let lastKey: Record<string, any> | undefined;
        
        // Paginate through all results (Query has 1MB limit per call)
        do {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND sk >= :since',
                ExpressionAttributeValues: {
                    ':pk': 'VIEW',
                    ':since': since
                },
                Select: 'COUNT',
                ExclusiveStartKey: lastKey
            }));
            totalCount += result.Count || 0;
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);
        
        return totalCount;
    } catch (error) {
        console.error('Error getting today view count:', error);
        return 0;
    }
}

// Get count of unique IPs in last X minutes (for "browsing now")
export async function getRecentViewCount(minutes: number = 5): Promise<number> {
    try {
        const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
        const uniqueIps = new Set<string>();
        let lastKey: Record<string, any> | undefined;
        
        // Paginate and collect unique IPs
        do {
            const result = await docClient.send(new QueryCommand({
                TableName: TABLE_NAME,
                KeyConditionExpression: 'pk = :pk AND sk >= :since',
                ExpressionAttributeValues: {
                    ':pk': 'VIEW',
                    ':since': since
                },
                ProjectionExpression: 'ip',
                ExclusiveStartKey: lastKey
            }));
            
            for (const item of result.Items || []) {
                if (item.ip) uniqueIps.add(item.ip);
            }
            lastKey = result.LastEvaluatedKey;
        } while (lastKey);
        
        return uniqueIps.size;
    } catch (error) {
        console.error('Error getting recent view count:', error);
        return 0;
    }
}

// Log a search query
export async function logSearch(query: string): Promise<void> {
    try {
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
                pk: 'SEARCH',
                sk: new Date().toISOString(),
                query: query.substring(0, 100) // Limit length
            }
        }));
    } catch (error) {
        console.error('Error logging search:', error);
    }
}

// Get recent searches
export async function getRecentSearches(limit: number = 10): Promise<string[]> {
    try {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'SEARCH'
            },
            ScanIndexForward: false, // Descending (newest first)
            Limit: limit * 2 // Get extra to dedupe
        }));
        
        // Dedupe and limit
        const seen = new Set<string>();
        const searches: string[] = [];
        for (const item of result.Items || []) {
            const q = (item.query as string)?.toLowerCase();
            if (q && !seen.has(q) && q.length > 1) {
                seen.add(q);
                searches.push(item.query as string);
                if (searches.length >= limit) break;
            }
        }
        return searches;
    } catch (error) {
        console.error('Error getting recent searches:', error);
        return [];
    }
}

// ============ FEATURE REQUESTS ============

export interface FeatureRequest {
    pk: string; // 'FEATURE'
    sk: string; // timestamp-based ID
    id: string;
    title: string;
    description?: string;
    created_by: string; // name or "Anonymous"
    created_by_ip: string; // IP for spam prevention
    created_at: string;
    upvotes: string[]; // array of IPs
    downvotes: string[]; // array of IPs
}

export async function createFeatureRequest(
    title: string, 
    description: string, 
    ip: string,
    name?: string
): Promise<FeatureRequest | null> {
    try {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const feature: FeatureRequest = {
            pk: 'FEATURE',
            sk: id,
            id,
            title: title.substring(0, 200),
            description: description?.substring(0, 500) || '',
            created_by: name || 'Anonymous',
            created_by_ip: ip,
            created_at: new Date().toISOString(),
            upvotes: [ip], // Creator auto-upvotes
            downvotes: []
        };
        
        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: feature
        }));
        
        return feature;
    } catch (error) {
        console.error('Error creating feature request:', error);
        return null;
    }
}

export async function getFeatureRequests(): Promise<FeatureRequest[]> {
    try {
        const result = await docClient.send(new QueryCommand({
            TableName: TABLE_NAME,
            KeyConditionExpression: 'pk = :pk',
            ExpressionAttributeValues: {
                ':pk': 'FEATURE'
            }
        }));
        
        const features = (result.Items || []) as FeatureRequest[];
        
        // Sort by score (upvotes - downvotes), then by date
        features.sort((a, b) => {
            const scoreA = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
            const scoreB = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        return features;
    } catch (error) {
        console.error('Error getting feature requests:', error);
        return [];
    }
}

export async function voteFeature(
    featureId: string, 
    visitorIp: string, 
    voteType: 'up' | 'down'
): Promise<boolean> {
    try {
        // First get the current feature
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'FEATURE', sk: featureId }
        }));
        
        if (!result.Item) return false;
        
        const feature = result.Item as FeatureRequest;
        let upvotes = feature.upvotes || [];
        let downvotes = feature.downvotes || [];
        
        // Remove from both arrays first
        upvotes = upvotes.filter(ip => ip !== visitorIp);
        downvotes = downvotes.filter(ip => ip !== visitorIp);
        
        // Add to appropriate array (toggle off if already voted same way)
        const wasUpvoted = feature.upvotes?.includes(visitorIp);
        const wasDownvoted = feature.downvotes?.includes(visitorIp);
        
        if (voteType === 'up' && !wasUpvoted) {
            upvotes.push(visitorIp);
        } else if (voteType === 'down' && !wasDownvoted) {
            downvotes.push(visitorIp);
        }
        // If they clicked the same vote again, it just removes (toggle off)
        
        await docClient.send(new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'FEATURE', sk: featureId },
            UpdateExpression: 'SET upvotes = :up, downvotes = :down',
            ExpressionAttributeValues: {
                ':up': upvotes,
                ':down': downvotes
            }
        }));
        
        return true;
    } catch (error) {
        console.error('Error voting on feature:', error);
        return false;
    }
}

export async function deleteFeatureRequest(featureId: string, username: string): Promise<boolean> {
    try {
        // First get the feature to verify ownership
        const result = await docClient.send(new GetCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'FEATURE', sk: featureId }
        }));
        
        if (!result.Item) return false;
        
        const feature = result.Item as FeatureRequest;
        
        // Only allow deletion by the creator
        if (feature.created_by !== username) {
            return false;
        }
        
        await docClient.send(new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { pk: 'FEATURE', sk: featureId }
        }));
        
        return true;
    } catch (error) {
        console.error('Error deleting feature request:', error);
        return false;
    }
}

// ============ WAITLIST ============

export interface WaitlistEntry {
    pk: string; // 'WAITLIST'
    sk: string; // timestamp-based ID
    id: string;
    name: string;
    email: string;
    product: string;
    created_at: string;
    ip: string;
}

async function syncToCampaignMonitor(name: string, email: string, product: string): Promise<void> {
    const apiKey = process.env.CM_API_KEY;
    const listId = process.env.CM_LIST_ID;
    if (!apiKey || !listId) return;

    try {
        const res = await fetch(`https://api.createsend.com/api/v3.3/subscribers/${listId}.json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${Buffer.from(`${apiKey}:x`).toString('base64')}`
            },
            body: JSON.stringify({
                EmailAddress: email,
                Name: name,
                CustomFields: [
                    { Key: 'product', Value: product }
                ],
                ConsentToTrack: 'Yes',
                Resubscribe: true
            })
        });
        if (!res.ok) {
            console.error('CM sync failed:', res.status, await res.text());
        }
    } catch (error) {
        console.error('CM sync error:', error);
    }
}

export async function addToWaitlist(name: string, email: string, ip: string, product: string = 'dase-hub'): Promise<WaitlistEntry | null> {
    try {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const entry: WaitlistEntry = {
            pk: 'WAITLIST',
            sk: id,
            id,
            name: name.substring(0, 100) || '(none)',
            email: email.substring(0, 200) || '(none)',
            product: product || 'dase-hub',
            created_at: new Date().toISOString(),
            ip: ip || 'Unknown'
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: entry
        }));

        // Sync to Campaign Monitor (awaited so Lambda doesn't exit early)
        await syncToCampaignMonitor(entry.name, entry.email, entry.product);

        return entry;
    } catch (error) {
        console.error('Error adding to waitlist:', error);
        return null;
    }
}
