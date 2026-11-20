const expo = require('eslint-config-expo/flat')

module.exports = [
  ...expo,
  { ignores: ['dist/*', 'scripts/*', 'test/*', 'android/*', 'ios/*'] },
  {
    rules: {
      // Reglas del compilador de React: marcan como error patrones válidos de
      // react-native-reanimated (mutar `shared.value`) y refs de motores en tiempo real.
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Estilo: los tipos ya son consistentes con las librerías ported de la web.
      '@typescript-eslint/array-type': 'off',
    },
  },
]
