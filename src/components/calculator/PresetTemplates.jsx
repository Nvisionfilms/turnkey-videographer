import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Briefcase, PartyPopper, Camera, Video, Music } from "lucide-react";

const PRESETS = {
  wedding: {
    name: "Wedding",
    icon: PartyPopper,
    color: "#ec4899",
    description: "Full day wedding coverage",
    config: {
      client_name: "",
      project_title: "Wedding Coverage",
      day_type: "full",
      custom_hours: 10,
      experience_level: "Standard",
      selected_roles: [
        { role_id: "rate_1", role_name: "Director of Photography", quantity: 1 },
        { role_id: "rate_2", role_name: "Camera Operator (no camera)", quantity: 1 }
      ],
      include_audio_pre_post: false,
      gear_enabled: true,
      apply_nonprofit_discount: false,
      apply_rush_fee: false
    }
  },
  corporate: {
    name: "Corporate",
    icon: Briefcase,
    color: "#3b82f6",
    description: "Professional corporate video",
    config: {
      client_name: "",
      project_title: "Corporate Video",
      day_type: "full",
      custom_hours: 8,
      experience_level: "Senior",
      selected_roles: [
        { role_id: "rate_1", role_name: "Director of Photography", quantity: 1 },
        { role_id: "rate_4", role_name: "Gaffer", quantity: 1 }
      ],
      include_audio_pre_post: true,
      gear_enabled: true,
      apply_nonprofit_discount: false,
      apply_rush_fee: false
    }
  },
  event: {
    name: "Event",
    icon: Camera,
    color: "#8b5cf6",
    description: "Live event coverage",
    config: {
      client_name: "",
      project_title: "Event Coverage",
      day_type: "half",
      custom_hours: 6,
      experience_level: "Standard",
      selected_roles: [
        { role_id: "rate_1", role_name: "Director of Photography", quantity: 1 }
      ],
      include_audio_pre_post: false,
      gear_enabled: true,
      apply_nonprofit_discount: false,
      apply_rush_fee: false
    }
  },
  commercial: {
    name: "Commercial",
    icon: Video,
    color: "#10b981",
    description: "High-end commercial production",
    config: {
      client_name: "",
      project_title: "Commercial Production",
      day_type: "full",
      custom_hours: 10,
      experience_level: "Senior",
      selected_roles: [
        { role_id: "rate_1", role_name: "Director of Photography", quantity: 1 },
        { role_id: "rate_2", role_name: "Camera Operator (no camera)", quantity: 1 },
        { role_id: "rate_4", role_name: "Gaffer", quantity: 1 },
        { role_id: "rate_5", role_name: "Grip", quantity: 1 },
        { role_id: "rate_9", role_name: "Drone Operator", quantity: 1 }
      ],
      include_audio_pre_post: true,
      gear_enabled: true,
      apply_nonprofit_discount: false,
      apply_rush_fee: false
    }
  },
  solo: {
    name: "Solo Shoot",
    icon: Sparkles,
    color: "#f59e0b",
    description: "One-person operation",
    config: {
      client_name: "",
      project_title: "Solo Shoot",
      day_type: "half",
      custom_hours: 4,
      experience_level: "Standard",
      selected_roles: [
        { role_id: "rate_1", role_name: "Director of Photography", quantity: 1 }
      ],
      include_audio_pre_post: false,
      gear_enabled: true,
      apply_nonprofit_discount: false,
      apply_rush_fee: false
    }
  },
  musicVideo: {
    name: "Music Video",
    icon: Music,
    color: "#ef4444",
    description: "Creative music video production",
    config: {
      client_name: "",
      project_title: "Music Video",
      day_type: "full",
      custom_hours: 12,
      experience_level: "Standard",
      selected_roles: [
        { role_id: "rate_2", role_name: "Camera Operator (no camera)", quantity: 1 }
      ],
      include_audio_pre_post: false,
      gear_enabled: true,
      apply_nonprofit_discount: false,
      apply_rush_fee: false,
      custom_price_override: null
    }
  }
};

export default function PresetTemplates({ onApplyPreset }) {
  return (
    <Card className="shadow-md" style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-dark)' }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--color-accent-primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Quick Start Templates
          </span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => {
            const Icon = preset.icon;
            return (
              <Button
                key={key}
                variant="outline"
                className="h-auto flex-col gap-2 p-3 w-full"
                style={{
                  background: 'var(--color-bg-primary)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                onClick={() => onApplyPreset(preset.config)}
              >
                <Icon className="w-5 h-5" style={{ color: preset.color }} />
                <div className="text-center">
                  <div className="text-xs font-semibold">{preset.name}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    {preset.description}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
