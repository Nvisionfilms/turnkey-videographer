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
    <div className="mb-4">
      <div className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-muted)' }}>
        Starting Points
      </div>
      <div className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
        Templates prefill structure. They do not decide pricing.
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            className="px-3 py-1.5 rounded text-xs transition-colors"
            style={{
              background: 'var(--color-bg-tertiary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)'
            }}
            onClick={() => onApplyPreset(preset.config)}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--color-border-dark)';
              e.target.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'var(--color-border)';
              e.target.style.color = 'var(--color-text-secondary)';
            }}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </div>
  );
}
