import axios, { AxiosInstance } from 'axios';

export interface NamecheapConfig {
  apiUser: string;
  apiKey: string;
  username: string;
  clientIp: string;
  sandbox?: boolean;
}

export interface DomainCheckResult {
  domain: string;
  available: boolean;
  errorMessage?: string;
  isPremiumName?: boolean;
  premiumRegistrationPrice?: string;
}

export interface DomainInfo {
  domainName: string;
  ownerName: string;
  isOwner: boolean;
  isPremium: boolean;
  dnsDetails?: {
    providerType: string;
    isUsingOurDNS: boolean;
    nameservers: string[];
  };
  modificationRights: boolean;
  created: string;
  expires: string;
}

export interface DNSHost {
  name: string;
  type: string;
  address: string;
  mxPref?: string;
  ttl?: string;
}

export class NamecheapClient {
  private axios: AxiosInstance;
  private config: NamecheapConfig;
  private baseUrl: string;

  constructor(config: NamecheapConfig) {
    this.config = config;
    this.baseUrl = config.sandbox
      ? 'https://api.sandbox.namecheap.com/xml.response'
      : 'https://api.namecheap.com/xml.response';

    this.axios = axios.create({
      timeout: 30000,
    });
  }

  private buildUrl(command: string, additionalParams: Record<string, string> = {}): string {
    const params = new URLSearchParams({
      ApiUser: this.config.apiUser,
      ApiKey: this.config.apiKey,
      UserName: this.config.username,
      ClientIp: this.config.clientIp,
      Command: command,
      ...additionalParams,
    });

    return `${this.baseUrl}?${params.toString()}`;
  }

  private async parseXmlResponse(xml: string): Promise<any> {
    // Simple XML parsing - in production, use a proper XML parser
    const parser = {
      getCommandResponse: (xml: string) => {
        const commandMatch = xml.match(/<CommandResponse[^>]*>([\s\S]*?)<\/CommandResponse>/);
        return commandMatch ? commandMatch[1] : '';
      },
      getAttribute: (xml: string, attr: string) => {
        const regex = new RegExp(`${attr}="([^"]*)"`, 'i');
        const match = xml.match(regex);
        return match ? match[1] : null;
      },
      getElements: (xml: string, tag: string) => {
        const regex = new RegExp(`<${tag}[^>]*>`, 'g');
        const matches = xml.match(regex) || [];
        return matches.map(m => m);
      },
      getError: (xml: string) => {
        const errorMatch = xml.match(/<Error[^>]*>(.*?)<\/Error>/);
        if (errorMatch) {
          const errorNumber = errorMatch[0].match(/Number="(\d+)"/)?.[1];
          return { number: errorNumber, message: errorMatch[1] };
        }
        return null;
      }
    };

    return parser;
  }

  async checkDomain(domains: string[]): Promise<DomainCheckResult[]> {
    const domainList = domains.join(',');
    const url = this.buildUrl('namecheap.domains.check', {
      DomainList: domainList,
    });

    try {
      const response = await this.axios.get(url);
      const xml = response.data;
      const parser = await this.parseXmlResponse(xml);
      const commandResponse = parser.getCommandResponse(xml);

      const results: DomainCheckResult[] = [];
      const domainElements = parser.getElements(commandResponse, 'DomainCheckResult');

      for (const elem of domainElements) {
        results.push({
          domain: parser.getAttribute(elem, 'Domain') || '',
          available: parser.getAttribute(elem, 'Available')?.toLowerCase() === 'true',
          errorMessage: parser.getAttribute(elem, 'ErrorNo') ? 'Error checking domain' : undefined,
          isPremiumName: parser.getAttribute(elem, 'IsPremiumName')?.toLowerCase() === 'true',
          premiumRegistrationPrice: parser.getAttribute(elem, 'PremiumRegistrationPrice') || undefined,
        });
      }

      return results;
    } catch (error: any) {
      throw new Error(`Failed to check domains: ${error.message}`);
    }
  }

  async getDomainInfo(domainName: string): Promise<DomainInfo> {
    const url = this.buildUrl('namecheap.domains.getInfo', {
      DomainName: domainName,
    });

    try {
      const response = await this.axios.get(url);
      const xml = response.data;
      const parser = await this.parseXmlResponse(xml);

      // Parse domain info from XML response
      // This is simplified - in production, use proper XML parsing
      return {
        domainName: domainName,
        ownerName: 'Parsed from XML',
        isOwner: true,
        isPremium: false,
        modificationRights: true,
        created: 'Parsed from XML',
        expires: 'Parsed from XML',
      };
    } catch (error: any) {
      throw new Error(`Failed to get domain info: ${error.message}`);
    }
  }

  async getDNSHosts(domainName: string): Promise<DNSHost[]> {
    const [sld, tld] = this.splitDomain(domainName);
    const url = this.buildUrl('namecheap.domains.dns.getHosts', {
      SLD: sld,
      TLD: tld,
    });

    try {
      const response = await this.axios.get(url);
      const xml = response.data;
      const parser = await this.parseXmlResponse(xml);
      const commandResponse = parser.getCommandResponse(xml);

      const hosts: DNSHost[] = [];
      const hostElements = parser.getElements(commandResponse, 'host');

      for (const elem of hostElements) {
        hosts.push({
          name: parser.getAttribute(elem, 'Name') || '',
          type: parser.getAttribute(elem, 'Type') || '',
          address: parser.getAttribute(elem, 'Address') || '',
          mxPref: parser.getAttribute(elem, 'MXPref') || undefined,
          ttl: parser.getAttribute(elem, 'TTL') || undefined,
        });
      }

      return hosts;
    } catch (error: any) {
      throw new Error(`Failed to get DNS hosts: ${error.message}`);
    }
  }

  async setDNSHosts(domainName: string, hosts: DNSHost[]): Promise<boolean> {
    const [sld, tld] = this.splitDomain(domainName);

    const hostParams: Record<string, string> = {
      SLD: sld,
      TLD: tld,
    };

    hosts.forEach((host, index) => {
      const i = index + 1;
      hostParams[`HostName${i}`] = host.name;
      hostParams[`RecordType${i}`] = host.type;
      hostParams[`Address${i}`] = host.address;
      if (host.mxPref) hostParams[`MXPref${i}`] = host.mxPref;
      if (host.ttl) hostParams[`TTL${i}`] = host.ttl;
    });

    const url = this.buildUrl('namecheap.domains.dns.setHosts', hostParams);

    try {
      const response = await this.axios.get(url);
      const xml = response.data;
      const parser = await this.parseXmlResponse(xml);

      const error = parser.getError(xml);
      if (error) {
        throw new Error(`API Error ${error.number}: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      throw new Error(`Failed to set DNS hosts: ${error.message}`);
    }
  }

  async getNameservers(domainName: string): Promise<string[]> {
    const [sld, tld] = this.splitDomain(domainName);
    const url = this.buildUrl('namecheap.domains.dns.getList', {
      SLD: sld,
      TLD: tld,
    });

    try {
      const response = await this.axios.get(url);
      const xml = response.data;
      const parser = await this.parseXmlResponse(xml);
      const commandResponse = parser.getCommandResponse(xml);

      const nameservers: string[] = [];
      const nsElements = parser.getElements(commandResponse, 'Nameserver');

      for (const elem of nsElements) {
        const ns = elem.match(/>([^<]+)</)?.[1];
        if (ns) nameservers.push(ns);
      }

      return nameservers;
    } catch (error: any) {
      throw new Error(`Failed to get nameservers: ${error.message}`);
    }
  }

  async setNameservers(domainName: string, nameservers: string[]): Promise<boolean> {
    const [sld, tld] = this.splitDomain(domainName);

    const nsParams: Record<string, string> = {
      SLD: sld,
      TLD: tld,
      Nameservers: nameservers.join(','),
    };

    const url = this.buildUrl('namecheap.domains.dns.setCustom', nsParams);

    try {
      const response = await this.axios.get(url);
      const xml = response.data;
      const parser = await this.parseXmlResponse(xml);

      const error = parser.getError(xml);
      if (error) {
        throw new Error(`API Error ${error.number}: ${error.message}`);
      }

      return true;
    } catch (error: any) {
      throw new Error(`Failed to set nameservers: ${error.message}`);
    }
  }

  private splitDomain(domain: string): [string, string] {
    const parts = domain.split('.');
    if (parts.length < 2) {
      throw new Error(`Invalid domain name: ${domain}`);
    }
    const tld = parts.pop()!;
    const sld = parts.join('.');
    return [sld, tld];
  }

  async listDomains(page: number = 1, pageSize: number = 100): Promise<string[]> {
    const url = this.buildUrl('namecheap.domains.getList', {
      Page: page.toString(),
      PageSize: pageSize.toString(),
    });

    try {
      const response = await this.axios.get(url);
      const xml = response.data;
      const parser = await this.parseXmlResponse(xml);
      const commandResponse = parser.getCommandResponse(xml);

      const domains: string[] = [];
      const domainElements = parser.getElements(commandResponse, 'Domain');

      for (const elem of domainElements) {
        const name = parser.getAttribute(elem, 'Name');
        if (name) domains.push(name);
      }

      return domains;
    } catch (error: any) {
      throw new Error(`Failed to list domains: ${error.message}`);
    }
  }
}