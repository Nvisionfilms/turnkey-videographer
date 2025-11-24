import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";

export default function CameraSelector({ cameras, selectedCamera, onCameraChange }) {
  const defaultCamera = cameras?.find(c => c.is_default);
  const displayValue = selectedCamera || defaultCamera?.id || "";

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
        <Camera className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
        Camera
      </Label>
      <Select value={displayValue} onValueChange={onCameraChange}>
        <SelectTrigger 
          className="w-full"
          style={{ 
            background: 'var(--color-input-bg)', 
            color: 'var(--color-text-primary)', 
            borderColor: 'var(--color-input-border)' 
          }}
        >
          <SelectValue placeholder="Select camera" />
        </SelectTrigger>
        <SelectContent style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          {cameras && cameras.length > 0 ? (
            cameras.map((camera) => (
              <SelectItem 
                key={camera.id} 
                value={camera.id}
                style={{ color: 'var(--color-text-primary)' }}
              >
                {camera.make} {camera.model}
                {camera.is_default && <span className="ml-2 text-xs" style={{ color: 'var(--color-accent-primary)' }}>(Default)</span>}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="none" disabled style={{ color: 'var(--color-text-muted)' }}>
              No cameras configured
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
