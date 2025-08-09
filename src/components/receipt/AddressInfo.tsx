
import React from 'react';
import { MapPin } from 'lucide-react';
import DataRow from './DataRow';

interface AddressInfoProps {
  storeDetails?: {
    name: string;
    address?: string;
  };
  receiptNumber?: {
    value: string;
  };
}

const AddressInfo: React.FC<AddressInfoProps> = ({ storeDetails, receiptNumber }) => {
  return (
    <>
      {storeDetails?.address && (
        <DataRow
          label="Address"
          value={storeDetails.address}
          icon={MapPin}
        />
      )}
      
      {receiptNumber && (
        <DataRow
          label="Receipt #"
          value={receiptNumber.value}
        />
      )}
    </>
  );
};

export default AddressInfo;
