import React, { FC } from 'react';
import { GestureResponderHandlers, Animated, StyleSheet } from 'react-native';
import { SwipeButtonCommonProps } from './SwipeButton';

export interface SwipeButtonCircleProps extends SwipeButtonCommonProps {
  /**
   * GestureHandlers for when swiping the button
   */
  panHandlers: GestureResponderHandlers;

  /**
   * Opacity of the element
   */
  opacity?: number;

  /**
   * Element that should be displaied inside the button
   */
  Icon: JSX.Element;

  /**
   * Determinates the value of the button
   */
  translateX: Animated.Value;

  /**
   * Background color for the circle
   */
  circleBackgroundColor?: string;
}

export const SwipeButtonCircle: FC<SwipeButtonCircleProps> = ({
  Icon,
  opacity,
  panHandlers,
  translateX,
  height,
  borderRadius,
  circleBackgroundColor,
}) => {
  return (
    <Animated.View
      testID="Button"
      {...panHandlers}
      style={[
        styles.iconContainer,
        {
          opacity,
          width: height,
          height,
          borderRadius,
          transform: [{ translateX }],
        },
      ]}>
      <Animated.View
        testID="IconContainer"
        style={[
          styles.innerIconContainer,
          {
            backgroundColor: circleBackgroundColor,
            width: height,
            height,
            borderRadius,
          },
          { opacity },
        ]}>
        {Icon}
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    position: 'absolute',
    backgroundColor: '#e9ff6b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
