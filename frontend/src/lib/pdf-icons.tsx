// SVG Icon Components for PDF (Lucide icons as SVG paths)
import React from 'react';
import { Svg, Path } from '@react-pdf/renderer';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const iconSize = 16;
const iconColor = '#1D1D1F';
const iconStrokeWidth = 1.5;

export const Building2Icon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 12h4M10 12h4M6 16h4M10 16h4M6 8h4M10 8h4"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18 9v11"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const UserIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MailIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m22 6-10 7L2 6"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FileTextIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PackageIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="m21 16-8-4.5L5 16m16 0-8 4.5L5 16m16 0v4.5L13 25l-8-4.5V16M5 16l8-4.5L21 16M5 7.5l8 4.5 8-4.5M13 3L5 7.5 13 12l8-4.5L13 3Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TruckIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M16 3h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2M16 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8M16 3v18M8 3v18M1 9h6m12 0h6"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FolderOpenIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="m6 14 1.5-4.5L12 11l4.5-1.5L18 8M6 14H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.343a1 1 0 0 1 .707.293l.707.707a1 1 0 0 0 .707.293H18a2 2 0 0 1 2 2v2M6 14l-1.5 4.5a1 1 0 0 0 .84 1.28H20M18 8v6"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CheckCircle2Icon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = '#34C759',
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="m9 11 3 3L22 4"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ClockIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CreditCardIcon: React.FC<IconProps> = ({ 
  size = iconSize, 
  color = iconColor,
  strokeWidth = iconStrokeWidth 
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 10h20M7 16h.01M11 16h.01"
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
