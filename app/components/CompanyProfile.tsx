import React from 'react';
import { Building } from 'lucide-react';

interface CompanyProfile {
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  website?: string;
  industry?: string;
  sector?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  companyOfficers?: any[];
}

interface CompanyProfileProps {
  profile: CompanyProfile;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ profile }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-semibold">Company Profile</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Sector</p>
              <p className="font-medium">{profile.sector || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Industry</p>
              <p className="font-medium">{profile.industry || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Employees</p>
              <p className="font-medium">{profile.fullTimeEmployees ? profile.fullTimeEmployees.toLocaleString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Website</p>
              {profile.website ? (
                <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                  {profile.website}
                </a>
              ) : (
                <p className="font-medium">N/A</p>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="space-y-3">
            <div>
              <p className="text-gray-400 text-sm">Address</p>
              <div className="font-medium">
                {profile.address1 && <p>{profile.address1}</p>}
                {(profile.city || profile.state || profile.zip) && (
                  <p>{[profile.city, profile.state, profile.zip].filter(Boolean).join(', ')}</p>
                )}
                {profile.country && <p>{profile.country}</p>}
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Phone</p>
              <p className="font-medium">{profile.phone || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {profile.longBusinessSummary && (
        <div className="mt-6">
          <p className="text-gray-400 text-sm mb-2">Business Summary</p>
          <p className="text-gray-300 text-sm leading-relaxed">{profile.longBusinessSummary}</p>
        </div>
      )}
    </div>
  );
};