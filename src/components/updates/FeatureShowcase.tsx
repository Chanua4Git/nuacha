import { useState, useMemo } from 'react';
import { features, userTypeFilters, featureTypeFilters } from '@/constants/featureShowcase';
import { FeatureShowcaseCard } from './FeatureShowcaseCard';
import { FeatureShowcaseFilter } from './FeatureShowcaseFilter';
import { Eye } from 'lucide-react';

export function FeatureShowcase() {
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [featureTypeFilter, setFeatureTypeFilter] = useState('all');

  const filteredFeatures = useMemo(() => {
    return features.filter((feature) => {
      // User type filtering
      const matchesUserType = userTypeFilter === 'all' || 
        feature.benefitsFor.some((persona) => {
          const lowerPersona = persona.toLowerCase();
          switch (userTypeFilter) {
            case 'taxpayers':
              return lowerPersona.includes('taxpayer');
            case 'families':
              return lowerPersona.includes('families') || lowerPersona.includes('parents') || lowerPersona.includes('guardians') || lowerPersona.includes('caregiver');
            case 'self-employed':
              return lowerPersona.includes('self-employed') || lowerPersona.includes('freelancer') || lowerPersona.includes('small business');
            case 'employees':
              return lowerPersona.includes('employees');
            case 'donors':
              return lowerPersona.includes('donor');
            case 'health':
              return lowerPersona.includes('health') || lowerPersona.includes('medical');
            case 'homeowners':
              return lowerPersona.includes('homeowner');
            case 'students':
              return lowerPersona.includes('student');
            case 'landlords':
              return lowerPersona.includes('landlord');
            case 'insurance':
              return lowerPersona.includes('insurance') || lowerPersona.includes('claims');
            case 'tt-business':
              return feature.isLocalTT === true;
            default:
              return true;
          }
        });

      // Feature type filtering using featureTypes array
      const matchesFeatureType = featureTypeFilter === 'all' ||
        feature.featureTypes?.includes(featureTypeFilter);

      return matchesUserType && matchesFeatureType;
    });
  }, [userTypeFilter, featureTypeFilter]);

  return (
    <div className="space-y-8">
      {/* Hero Introduction */}
      <div className="text-center space-y-3 pb-4">
        <h2 className="text-3xl font-bold">Discover what Nuacha can do for you</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          From receipt scanning to Trinidad & Tobago payroll—explore features built for real people managing real finances
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-6 bg-muted/30 rounded-lg p-6">
        <FeatureShowcaseFilter
          title="Filter by who you are"
          options={userTypeFilters}
          activeFilter={userTypeFilter}
          onFilterChange={setUserTypeFilter}
        />
        <FeatureShowcaseFilter
          title="Filter by feature type"
          options={featureTypeFilters}
          activeFilter={featureTypeFilter}
          onFilterChange={setFeatureTypeFilter}
        />
      </div>

      {/* Feature Cards Grid */}
      {filteredFeatures.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeatures.map((feature) => (
            <FeatureShowcaseCard key={feature.id} feature={feature} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2">No features match your filters</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters to see more features
          </p>
        </div>
      )}
    </div>
  );
}
