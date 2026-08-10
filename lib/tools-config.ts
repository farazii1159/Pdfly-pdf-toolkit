/*import type { LucideIcon } from 'lucide-react';*/

export type ToolField = {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  placeholder?: string;
  options?: { label: string; value: string }[];
  defaultValue?: string;
  required?: boolean;
};

export type ToolConfig = {
  slug: string;
  name: string;
  description: string;
  category:
    | 'Convert'
    | 'Organize'
    | 'Edit'
    | 'Security'
    | 'Advanced'
    | 'Automation';

  // IMPORTANT:
  // Keep icon as a string so this config can safely pass
  // from Server Components to Client Components.
  icon: string;

  status: 'working' | 'coming-soon';
  accept: string;
  multiple: boolean;
  fields?: ToolField[];
  outputHint?: string;
};

export const TOOLS: ToolConfig[] = [
  // ─────────────────────────────────────────────
  // Convert
  // ─────────────────────────────────────────────
  {
    slug: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert DOC and DOCX documents into PDF.',
    category: 'Convert',
    icon: 'FileType',
    status: 'working',
    accept: '.doc,.docx',
    multiple: false,
  },

  {
    slug: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert PDF pages into JPG images.',
    category: 'Convert',
    icon: 'FileImage',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    outputHint: 'Downloads a .zip with one JPG per page.',
  },

  {
    slug: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert images into a PDF document.',
    category: 'Convert',
    icon: 'ImageIcon',
    status: 'working',
    accept: '.jpg,.jpeg,.png',
    multiple: true,
  },

  {
    slug: 'pdf-to-powerpoint',
    name: 'PDF to PowerPoint',
    description: 'Turn PDF pages into editable presentation slides.',
    category: 'Convert',
    icon: 'Presentation',
    status: 'coming-soon',
    accept: '.pdf',
    multiple: false,
  },

  {
    slug: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract PDF tables and data into Excel.',
    category: 'Convert',
    icon: 'Sheet',
    status: 'coming-soon',
    accept: '.pdf',
    multiple: false,
  },

  {
  slug: 'powerpoint-to-pdf',
  name: 'PowerPoint to PDF',
  description: 'Convert PPT and PPTX presentations into PDF.',
  category: 'Convert',
  icon: 'Presentation',
  status: 'working',
  accept: '.ppt,.pptx',
  multiple: false,
  },

  {
  slug: 'excel-to-pdf',
  name: 'Excel to PDF',
  description: 'Convert Excel spreadsheets into PDF.',
  category: 'Convert',
  icon: 'Sheet',
  status: 'working',
  accept: '.xls,.xlsx',
  multiple: false,
  },

  {
  slug: 'html-to-pdf',
  name: 'HTML to PDF',
  description: 'Convert HTML files into PDF documents.',
  category: 'Convert',
  icon: 'Code2',
  status: 'working',
  accept: '.html,.htm',
  multiple: false,
  },

  {
    slug: 'pdf-to-markdown',
    name: 'PDF to Markdown',
    description: 'Convert PDF content into structured Markdown.',
    category: 'Convert',
    icon: 'FileDown',
    status: 'working',
    accept: '.pdf',
    multiple: false,
  },

  // ─────────────────────────────────────────────
  // Organize
  // ─────────────────────────────────────────────
  {
    slug: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    category: 'Organize',
    icon: 'Combine',
    status: 'working',
    accept: '.pdf',
    multiple: true,
  },

  {
    slug: 'split',
    name: 'Split PDF',
    description:
      'Separate pages or selected page ranges into individual PDFs.',
    category: 'Organize',
    icon: 'Scissors',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'range',
        label: 'Pages to extract',
        type: 'text',
        placeholder: 'e.g. 1-3,5',
        required: true,
      },
    ],
  },

  {
    slug: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while keeping good quality.',
    category: 'Organize',
    icon: 'Minimize2',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'quality',
        label: 'Compression level',
        type: 'select',
        defaultValue: 'medium',
        options: [
          {
            label: 'Low (smaller file)',
            value: 'low',
          },
          {
            label: 'Medium (recommended)',
            value: 'medium',
          },
          {
            label: 'High (better quality)',
            value: 'high',
          },
        ],
      },
    ],
  },

  {
    slug: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages to the correct orientation.',
    category: 'Organize',
    icon: 'RotateCw',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'degrees',
        label: 'Rotate by',
        type: 'select',
        defaultValue: '90',
        options: [
          {
            label: '90° clockwise',
            value: '90',
          },
          {
            label: '180°',
            value: '180',
          },
          {
            label: '270° clockwise',
            value: '270',
          },
        ],
      },
    ],
  },

  {
    slug: 'organize',
    name: 'Organize PDF',
    description: 'Reorder, remove, or organize PDF pages.',
    category: 'Organize',
    icon: 'ListOrdered',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'order',
        label: 'New page order',
        type: 'text',
        placeholder: 'e.g. 3,1,2',
        required: true,
      },
    ],
  },

  // {
  //   slug: 'crop',
  //   name: 'Crop PDF',
  //   description: 'Crop PDF pages and remove unwanted margins.',
  //   category: 'Organize',
  //   icon: 'Crop',
  //   status: 'coming-soon',
  //   accept: '.pdf',
  //   multiple: false,
  // },

  {
    slug: 'page-numbers',
    name: 'Page Numbers',
    description: 'Add page numbers to PDF documents.',
    category: 'Organize',
    icon: 'Hash',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'position',
        label: 'Position',
        type: 'select',
        defaultValue: 'bottom-center',
        options: [
          {
            label: 'Bottom center',
            value: 'bottom-center',
          },
          {
            label: 'Bottom right',
            value: 'bottom-right',
          },
          {
            label: 'Bottom left',
            value: 'bottom-left',
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────
  // Edit
  // ─────────────────────────────────────────────
  {
  slug: 'edit',
  name: 'Edit PDF',
  description: 'Add text to your PDF document.',
  category: 'Edit',
  icon: 'Edit3',
  status: 'working',
  accept: '.pdf',
  multiple: false,

  },

  {
    slug: 'watermark',
    name: 'Watermark',
    description: 'Add text or image watermarks to PDF files.',
    category: 'Edit',
    icon: 'PenLine',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'text',
        label: 'Watermark text',
        type: 'text',
        placeholder: 'e.g. CONFIDENTIAL',
        required: true,
      },
    ],
  },

  {
    slug: 'sign',
    name: 'Sign PDF',
    description: 'Add an electronic signature to your PDF.',
    category: 'Edit',
    icon: 'PenLine',
    status: 'working',
    accept: '.pdf',
    multiple: false,
  },

  {
    slug: 'forms',
    name: 'PDF Forms',
    description: 'Fill or create interactive PDF form fields.',
    category: 'Edit',
    icon: 'FormInput',
    status: 'coming-soon',
    accept: '.pdf',
    multiple: false,
  },

  {
    slug: 'redact',
    name: 'Redact PDF',
    description: 'Permanently hide sensitive information in a PDF.',
    category: 'Edit',
    icon: 'EyeOff',
    status: 'coming-soon',
    accept: '.pdf',
    multiple: false,
  },

  // ─────────────────────────────────────────────
  // Security
  // ─────────────────────────────────────────────
  {
    slug: 'protect',
    name: 'Protect PDF',
    description: 'Protect PDF documents with a password.',
    category: 'Security',
    icon: 'Lock',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'password',
        label: 'Password to set',
        type: 'password',
        placeholder: 'Enter a password',
        required: true,
      },
    ],
  },

  {
    slug: 'unlock',
    name: 'Unlock PDF',
    description: 'Remove password protection from PDFs when authorized.',
    category: 'Security',
    icon: 'Unlock',
    status: 'working',
    accept: '.pdf',
    multiple: false,
    fields: [
      {
        name: 'password',
        label: 'Current password',
        type: 'password',
        placeholder: 'Enter the current password',
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────
  // Advanced
  // ─────────────────────────────────────────────
  {
  slug: 'ocr',
  name: 'OCR PDF',
  description: 'To make the text searchable first convert the JPG image to PDF then use the OCR tool to extract and recognize the text.',
  category: 'Advanced',
  icon: 'ScanText',
  status: 'working',
  accept: '.pdf',
  multiple: false,
  fields: [
    {
      name: 'language',
      label: 'OCR Language',
      type: 'select',
      defaultValue: 'eng',
      options: [
        {
          label: 'English',
          value: 'eng',
        },
      ],
    },
  ],
  outputHint: 'Creates a searchable PDF with selectable text.',
  },

  {
    slug: 'repair',
    name: 'Repair PDF',
    description:
      'Attempt to recover readable content from damaged PDFs.',
    category: 'Advanced',
    icon: 'Wrench',
    status: 'working',
    accept: '.pdf',
    multiple: false,
  },

  // {
  //   slug: 'compare',
  //   name: 'Compare PDF',
  //   description:
  //     'Compare two PDF versions and identify differences.',
  //   category: 'Advanced',
  //   icon: 'GitCompare',
  //   status: 'coming-soon',
  //   accept: '.pdf',
  //   multiple: true,
  // },

  {
    slug: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    description:
      'Convert PDFs into the PDF/A archival format.',
    category: 'Advanced',
    icon: 'FileArchive',
    status: 'working',
    accept: '.pdf',
    multiple: false,
  },

  // {
  //   slug: 'ai-summarizer',
  //   name: 'AI Summarizer',
  //   description:
  //     'Generate a concise summary of your PDF content.',
  //   category: 'Advanced',
  //   icon: 'Sparkles',
  //   status: 'coming-soon',
  //   accept: '.pdf',
  //   multiple: false,
  // },

  // {
  //   slug: 'translate',
  //   name: 'Translate PDF',
  //   description:
  //     'Translate PDF content while preserving document structure where possible.',
  //   category: 'Advanced',
  //   icon: 'Languages',
  //   status: 'coming-soon',
  //   accept: '.pdf',
  //   multiple: false,
  // },

  {
  slug: 'scan-to-pdf',
  name: 'Scan to PDF',
  description: 'Create PDFs from scanned documents.',
  category: 'Advanced',
  icon: 'ScanLine',
  status: 'working',
  accept: '.jpg,.jpeg,.png',
  multiple: true,
  },

  // ─────────────────────────────────────────────
  // Automation
  // ─────────────────────────────────────────────
  {
    slug: 'workflow',
    name: 'Create a Workflow',
    description:
      'Combine PDF tools into a reusable workflow.',
    category: 'Automation',
    icon: 'Workflow',
    status: 'coming-soon',
    accept: '.pdf',
    multiple: false,
  },
];

export const CATEGORIES: ToolConfig['category'][] = [
  'Convert',
  'Organize',
  'Edit',
  'Security',
  'Advanced',
  'Automation',
];

export function getToolBySlug(
  slug: string
): ToolConfig | undefined {
  return TOOLS.find((tool) => tool.slug === slug);
}