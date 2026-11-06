import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';
import './preview.css';

const preview: Preview = {
	tags: ['autodocs'],
	initialGlobals: { backgrounds: { value: 'white' } },
	parameters: {
		layout: 'padded',
		controls: { expanded: true },
		a11y: { test: 'todo' },
		backgrounds: {
			options: {
				white: { name: 'White', value: '#ffffff' },
				brand: { name: 'Brand green', value: 'rgb(55, 154, 70)' },
				ink: { name: 'Ink', value: 'rgb(42, 41, 41)' },
				canvas: { name: 'Annotation screen', value: 'rgb(250, 250, 250)' }
			}
		},
		// The app's own breakpoints (viewportType in sketchpad/stores.ts).
		viewport: {
			options: {
				phone: { name: 'Phone (under 600)', styles: { width: '390px', height: '844px' } },
				tablet: { name: 'Tablet (600 to 899)', styles: { width: '768px', height: '1024px' } },
				laptop: { name: 'Laptop (900 to 1199)', styles: { width: '1024px', height: '768px' } },
				wide: { name: 'Wide (1200 and up)', styles: { width: '1440px', height: '900px' } }
			}
		},
		options: {
			storySort: {
				order: [
					'Introduction',
					'Foundations',
					['Colors', 'Typography', 'Space and shape', 'Motion and layers', 'Icons'],
					'Components',
					['Actions', 'Forms', 'Feedback', 'Overlays', 'Brand'],
					'Layouts',
					'Annotation',
					['Toolbar', 'Catalogue', 'Modals', 'Account'],
					'Design audit'
				]
			}
		}
	}
};

export default preview;
