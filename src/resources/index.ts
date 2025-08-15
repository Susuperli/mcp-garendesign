/**
 * MCP resource provider
 * Provides design rules and component templates
 */

export function getDesignRulesResource() {
  const designRules = {
    description: 'GarenCode Vue 3 component design rules and constraints',
    technology: {
      framework: 'Vue 3',
      uiLibrary: '@private-basic-components private component library',
      styling: 'Less',
      language: 'TypeScript',
      buildTool: 'Vite',
    },
    rules: {
      naming: {
        convention: 'PascalCase for component names',
        prefix: 'Use das- prefix, e.g., das-button, das-table',
        examples: ['DasUserProfile', 'DasProductCard', 'DasOrderSummary'],
        fileNaming: 'kebab-case for file names, e.g., user-profile.vue',
      },
      structure: {
        fileOrganization:
          'One folder per component, including main file, styles, and type definitions',
        dependencies: 'Use @private-basic-components private components',
        reusability:
          'Design for reusability, extract shared logic into composables',
        composition: 'Use Composition API and <script setup> syntax',
      },
      functionality: {
        singleResponsibility:
          'Each component should have a single responsibility',
        props:
          'Define all props using TypeScript interfaces with default values',
        emits: 'Explicitly define all events with TypeScript types',
        state: 'Manage state properly using ref and reactive',
      },
      styling: {
        less: 'Use Less preprocessor for styles',
        scoped: 'Use scoped styles in components',
        variables: 'Use design tokens and variables',
        responsive: 'Support responsive design with media queries',
      },
      accessibility: {
        aria: 'Add appropriate ARIA attributes',
        keyboard: 'Support keyboard navigation',
        contrast: 'Ensure sufficient color contrast',
        semantic: 'Use semantic HTML tags',
      },
      performance: {
        rendering: 'Optimize rendering performance using computed and watch',
        loading: 'Consider lazy loading and code splitting',
        memory: 'Avoid memory leaks, clean up side effects correctly',
      },
    },
    constraints: [
      'Components must use Vue 3 Composition API and <script setup> syntax',
      'All props must have explicit TypeScript types and default values',
      'Components must support responsive design',
      'Basic error handling is required',
      'Code must pass ESLint checks',
      'Styles must be written in Less with scoped support',
      'Use @private-basic-components private components',
    ],
    libraryGuidelines: {
      privateComponents: [
        'Use the @private-basic-components private component library',
        'Check whether suitable components exist in the private library',
        'Reuse components from the existing design system',
        'Maintain consistency with the overall project style',
      ],
      styling: [
        'Use the Less preprocessor',
        'Follow the BEM naming convention',
        'Use CSS variables and Less variables',
        'Support theme switching',
      ],
    },
    bestPractices: {
      composition: 'Use Composition API and <script setup>',
      reactivity: 'Use ref, reactive, computed, and watch appropriately',
      props: 'Props must have default values using withDefaults',
      emits: 'Define event types explicitly using defineEmits',
      slots: 'Use named slots and scoped slots appropriately',
      lifecycle: 'Use lifecycle hooks correctly',
      errorHandling: 'Include error boundaries and exception handling',
      componentSelection:
        'Choose the most suitable component from the private library',
    },
  };

  return {
    contents: [
      {
        type: 'text',
        text: JSON.stringify(designRules, null, 2),
      },
    ],
  };
}

export function getComponentTemplatesResource() {
  const templates = `
# GarenCode Vue 3 Component Templates

## Component selection strategy
Use the private component library (\`@private-basic-components\`) for development

## Basic component structure
\`\`\`vue
<template>
  <div class="das-component-name" :class="componentClass">
    <!-- Use private component -->
    <das-button 
      :type="type" 
      :size="size" 
      :disabled="disabled"
      @click="handleClick"
    >
      <slot />
    </das-button>
  </div>
  </template>

<script setup lang="ts">
import { computed } from 'vue'

// Define props interface
interface Props {
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  size?: 'small' | 'default' | 'large'
  disabled?: boolean
  className?: string
}

// Define props with default values
const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  size: 'default',
  disabled: false,
  className: ''
})

// Define emits
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
}>()

// Computed
const componentClass = computed(() => [
  'das-component-name',
  \`das-component-name--\${props.type}\`,
  \`das-component-name--\${props.size}\`,
  {
    'das-component-name--disabled': props.disabled
  },
  props.className
])

// Methods
const handleClick = (event: Event) => {
  if (props.disabled) return
  emit('change', event)
}
</script>

<style lang="less" scoped>
.das-component-name {
  display: inline-block;
  
  // Private component style overrides
  :deep(.das-button) {
    // Custom styles
  }
}
</style>
\`\`\`

## Common private components
- **das-button**: Button component
- **das-form**: Form component
- **das-table**: Table component
- **das-modal**: Modal component
- **das-drawer**: Drawer component
- **das-alert**: Alert component
- **das-select**: Select component
- **das-tabs**: Tabs component
- **das-action-more**: More actions dropdown
- **das-button-organizer**: Button organizer
- **das-metric-card**: Metric card
- **das-empty**: Empty state component
- **das-text-ellipsis**: Text ellipsis component
- **das-tool-tip**: Tooltip component

## Style guide

### Less variables
\`\`\`less
@primary-color: #1890ff;
@success-color: #52c41a;
@warning-color: #faad14;
@error-color: #ff4d4f;

@font-size-base: 14px;
@border-radius-base: 6px;
\`\`\`

### BEM naming convention
\`\`\`less
.das-component {
  &--primary { /* modifier */ }
  &--large { /* modifier */ }
  &__header { /* element */ }
  &__body { /* element */ }
}
\`\`\`

## Best practices
1. **Component selection**: Choose the most suitable component from the private library
2. **Performance optimization**: Use computed and watch appropriately
3. **Accessibility**: Add ARIA labels and support keyboard navigation
4. **Style guidelines**: Use Less and follow the BEM convention
5. **Private component usage**: Be familiar with the API; use slots and events appropriately
`;

  return {
    contents: [
      {
        type: 'text',
        text: templates,
      },
    ],
  };
}
