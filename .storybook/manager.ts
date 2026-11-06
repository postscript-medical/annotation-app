import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

addons.setConfig({
	theme: create({
		base: 'light',
		brandTitle: 'PostScript Medical',
		colorPrimary: 'rgb(55, 154, 70)',
		colorSecondary: 'rgb(55, 154, 70)',
		textColor: 'rgb(42, 41, 41)',
		appBg: '#f8f8f8',
		fontBase: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif"
	})
});
