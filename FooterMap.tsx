import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export const FooterMap: React.FC = () => {
  if (!hasValidKey) {
    return (
      <div className="w-full h-48 bg-slate-900 rounded-xl flex items-center justify-center p-4 text-center">
        <p className="text-xs text-slate-500">Harita gösterilemiyor (API Anahtarı eksik)</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="w-full h-48 rounded-xl overflow-hidden border border-slate-800">
        <Map
          defaultCenter={{lat: 39.9334, lng: 32.8597}} // Ankara, Turkey center as example
          defaultZoom={6}
          mapId="FOOTER_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{width: '100%', height: '100%'}}
          disableDefaultUI={true}
        >
          <AdvancedMarker position={{lat: 39.9334, lng: 32.8597}}>
            <Pin background="#3b82f6" glyphColor="#fff" />
          </AdvancedMarker>
        </Map>
      </div>
    </APIProvider>
  );
};
