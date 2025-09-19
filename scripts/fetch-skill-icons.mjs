import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { iconToSVG } from '@iconify/utils';
import { optimize } from 'svgo';

const require = createRequire(import.meta.url);
const skills = require('../data/skills.json');
const devicon = require('@iconify-json/devicon/icons.json');
const simpleIcons = require('@iconify-json/simple-icons/icons.json');
const materialSymbols = require('@iconify-json/material-symbols/icons.json');

const collections = new Map([
  ['devicon', devicon],
  ['simple-icons', simpleIcons],
  ['material-symbols', materialSymbols],
]);

const iconMap = {
  'typescript.svg': 'simple-icons:typescript',
  'python.svg': 'simple-icons:python',
  'javascript.svg': 'simple-icons:javascript',
  'csharp.svg': 'simple-icons:csharp',
  'java.svg': 'simple-icons:openjdk',
  'cpp.svg': 'simple-icons:cplusplus',
  'r.svg': 'simple-icons:r',
  'swift.svg': 'simple-icons:swift',
  'html5.svg': 'simple-icons:html5',
  'react.svg': 'simple-icons:react',
  'nodejs.svg': 'simple-icons:nodedotjs',
  'vue.svg': 'simple-icons:vuedotjs',
  'angular.svg': 'simple-icons:angular',
  'django.svg': 'simple-icons:django',
  'flask.svg': 'simple-icons:flask',
  'dotnet.svg': 'simple-icons:dotnet',
  'firebase.svg': 'simple-icons:firebase',
  'gcp.svg': 'simple-icons:googlecloud',
  'aws.svg': 'simple-icons:amazonwebservices',
  'azure.svg': 'simple-icons:microsoftazure',
  'sql.svg': 'material-symbols:database',
  'firestore.svg': 'simple-icons:firebase',
  'mysql.svg': 'simple-icons:mysql',
  'postgres.svg': 'simple-icons:postgresql',
  'snowflake.svg': 'simple-icons:snowflake',
  'oracle.svg': 'simple-icons:oracle',
  'tensorflow.svg': 'simple-icons:tensorflow',
  'pytorch.svg': 'simple-icons:pytorch',
  'huggingface.svg': 'simple-icons:huggingface',
  'keras.svg': 'simple-icons:keras',
  'numpy.svg': 'simple-icons:numpy',
  'opencv.svg': 'simple-icons:opencv',
  'nlp.svg': 'material-symbols:translate',
  'rlhf.svg': 'material-symbols:psychology-alt',
  'cv.svg': 'material-symbols:visibility',
  'git.svg': 'simple-icons:git',
  'docker.svg': 'simple-icons:docker',
  'cicd.svg': 'material-symbols:sync',
  'jenkins.svg': 'simple-icons:jenkins',
  'githubactions.svg': 'simple-icons:githubactions',
  'playwright.svg': 'simple-icons:playwright',
  'linux.svg': 'simple-icons:linux',
  'powershell.svg': 'simple-icons:powershell',
  'jira.svg': 'simple-icons:jira',
  'confluence.svg': 'simple-icons:confluence',
  'visualstudio.svg': 'simple-icons:visualstudio',
  'jest.svg': 'simple-icons:jest',
};

const fallbackIcon = 'material-symbols:category';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const targetDir = path.join(projectRoot, 'public', 'assets', 'icons', 'skills');

async function ensureIconsDirectory() {
  await fs.mkdir(targetDir, { recursive: true });
}

function mapIconsToSkills() {
  const required = new Set(skills.items.map(item => path.basename(item.icon)));
  const mappings = new Map(Object.entries(iconMap));
  const missing = [...required].filter(name => !mappings.has(name));
  if (missing.length) {
    console.warn('[icons] Missing mappings, using fallback for:', missing.join(', '));
    for (const name of missing) {
      mappings.set(name, fallbackIcon);
    }
  }
  return mappings;
}

function buildSvg(iconKey) {
  const [collection, iconName] = iconKey.split(':');
  const source = collections.get(collection);
  if (!source) {
    throw new Error(`Unknown icon collection: ${collection}`);
  }
  const iconData = source.icons?.[iconName];
  if (!iconData) {
    throw new Error(`Icon ${iconKey} not found in collection ${collection}`);
  }

  const { attributes, body } = iconToSVG(iconData, { height: 24 });
  const viewBoxAttr = attributes.viewBox || '0 0 24 24';
  const [minX, minY, originalWidth, originalHeight] = viewBoxAttr
    .split(/\s+/)
    .map(value => Number.parseFloat(value));

  let bodyContent = body;
  if (
    Number.isFinite(minX) &&
    Number.isFinite(minY) &&
    Number.isFinite(originalWidth) &&
    Number.isFinite(originalHeight)
  ) {
    const translateX = -minX;
    const translateY = -minY;
    const baseWidth = collection === 'simple-icons' ? 24 : originalWidth;
    const baseHeight = collection === 'simple-icons' ? 24 : originalHeight;
    const scaleX = baseWidth ? 24 / baseWidth : 1;
    const scaleY = baseHeight ? 24 / baseHeight : 1;
    const transforms = [];
    if (translateX || translateY) {
      transforms.push(`translate(${translateX} ${translateY})`);
    }
    if (Math.abs(scaleX - 1) > 1e-6 || Math.abs(scaleY - 1) > 1e-6) {
      transforms.push(`scale(${scaleX} ${scaleY})`);
    }
    if (transforms.length) {
      bodyContent = `<g transform="${transforms.join(' ')}">${bodyContent}</g>`;
    }
  }

  return {
    body: bodyContent,
    viewBox: '0 0 24 24',
  };
}

function normalizeColors(svgString) {
  return svgString
    .replace(/(fill|stroke)="([^"]+)"/g, (match, attr, value) => {
      const normalized = value.trim();
      if (normalized === 'none' || normalized.startsWith('url(')) {
        return `${attr}="${normalized}"`;
      }
      return `${attr}="currentColor"`;
    })
    .replace(/style="([^"]*)"/g, (_, style) => {
      const updated = style
        .split(';')
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(entry => {
          const [prop, val] = entry.split(':').map(part => part && part.trim());
          if (!prop || !val) return null;
          if (prop === 'fill' && val !== 'none') return 'fill:currentColor';
          if (prop === 'stroke' && val !== 'none') return 'stroke:currentColor';
          return `${prop}:${val}`;
        })
        .filter(Boolean)
        .join(';');
      return updated ? `style="${updated}"` : '';
    });
}

function finalizeSvg(svgContent) {
  let svg = svgContent;
  if (!/fill="currentColor"/.test(svg)) {
    svg = svg.replace('<svg', '<svg fill="currentColor"');
  }
  // remove duplicate fill attributes
  svg = svg.replace(/fill="currentColor"(\s+fill="currentColor")+/g, 'fill="currentColor"');
  return svg;
}

async function writeIconFile(fileName, svg) {
  const filePath = path.join(targetDir, fileName);
  await fs.writeFile(filePath, svg + '\n', 'utf8');
}

async function main() {
  await ensureIconsDirectory();
  const mappings = mapIconsToSkills();
  const results = [];

  for (const [fileName, iconKey] of mappings) {
    const svgData = buildSvg(iconKey);
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgData.viewBox}" fill="currentColor">${svgData.body}</svg>`;
    svg = normalizeColors(svg);

    const optimized = optimize(svg, {
      multipass: true,
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
              convertColors: {
                currentColor: true,
              },
            },
          },
        },
        'removeDimensions',
        {
          name: 'removeAttrs',
          params: {
            attrs: ['id', 'class', 'data-name'],
          },
        },
      ],
    }).data.trim();

    const finalSvg = finalizeSvg(optimized);
    const sizeInBytes = Buffer.byteLength(finalSvg, 'utf8');
    if (sizeInBytes > 15 * 1024) {
      console.warn(`[icons] Warning: ${fileName} is larger than 15KB (${(sizeInBytes / 1024).toFixed(1)}KB)`);
    }

    await writeIconFile(fileName, finalSvg);
    results.push({ fileName, iconKey });
  }

  results.sort((a, b) => a.fileName.localeCompare(b.fileName));
  console.log(`[icons] Wrote ${results.length} icons to public/assets/icons/skills`);
  for (const { fileName, iconKey } of results) {
    console.log(` - ${fileName} ← ${iconKey}`);
  }
}

main().catch(error => {
  console.error('[icons] Failed to fetch icons:', error);
  process.exit(1);
});
