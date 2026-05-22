import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ContentViewer({ content }) {
  if (!content) return null;

  return (
    <div className="content-viewer">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
