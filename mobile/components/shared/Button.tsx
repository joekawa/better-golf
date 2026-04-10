import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = (): string => {
    const baseStyle = 'min-h-[48px] rounded-lg justify-center items-center px-6';
    
    if (disabled || loading) {
      return `${baseStyle} bg-gray-400`;
    }
    
    switch (variant) {
      case 'primary':
        return `${baseStyle} bg-green-600`;
      case 'secondary':
        return `${baseStyle} bg-slate-600`;
      case 'text':
        return `${baseStyle} bg-transparent`;
      default:
        return `${baseStyle} bg-green-600`;
    }
  };

  const getTextStyle = (): string => {
    const baseStyle = 'font-medium text-base';
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return `${baseStyle} text-white`;
      case 'text':
        return `${baseStyle} text-green-600`;
      default:
        return `${baseStyle} text-white`;
    }
  };

  return (
    <TouchableOpacity
      className={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'text' ? '#16a34a' : '#ffffff'} />
      ) : (
        <Text className={getTextStyle()} style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};
