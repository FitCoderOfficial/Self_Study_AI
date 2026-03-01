'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, ExternalLink, Unlink, Loader2 } from 'lucide-react';

interface NotionSetupProps {
  userId: string;
}

// Notion 로고 SVG
function NotionLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="currentColor">
      <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="white"/>
      <path d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V17.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.683 0.047zM19.603 79.94V30.007c0 -2.333 0.777 -3.5 3.107 -3.697l59.2 -3.503c2.137 -0.193 3.107 1.167 3.107 3.497v49.353c0 2.333 -0.39 4.273 -3.883 4.467l-57.677 3.303c-3.493 0.193 -3.853 -1.167 -3.853 -3.487zm56.8 -46.62c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000"/>
    </svg>
  );
}

export default function NotionSetup({ userId }: NotionSetupProps) {
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('profiles')
      .select('notion_database_id')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        setIsConnected(!!data?.notion_database_id);
      });
  }, [userId]);

  // OAuth 콜백 결과 처리
  useEffect(() => {
    const notion = searchParams.get('notion');
    if (!notion) return;

    if (notion === 'success') {
      setIsConnected(true);
      setToastMsg({ type: 'success', text: '✅ Notion 연동이 완료되었습니다!' });
    } else if (notion === 'error') {
      const reason = searchParams.get('reason');
      setToastMsg({ type: 'error', text: `Notion 연동에 실패했습니다. (${reason || '알 수 없는 오류'})` });
    }

    setTimeout(() => setToastMsg(null), 5000);
  }, [searchParams]);

  const handleConnect = () => {
    window.location.href = '/api/notion/oauth';
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await fetch('/api/notion/disconnect', { method: 'POST' });
      setIsConnected(false);
    } catch { /* ignore */ }
    finally { setIsDisconnecting(false); }
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-gray-700">
      {/* 토스트 메시지 */}
      {toastMsg && (
        <div className={`mb-4 flex items-start gap-2 p-3 rounded-xl text-sm ${
          toastMsg.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-700'
        }`}>
          {toastMsg.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          }
          {toastMsg.text}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shrink-0 p-2">
          <NotionLogo className="w-full h-full" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white">Notion 연동</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">오답노트를 Notion에 자동으로 저장하세요</p>
        </div>
        {isConnected && (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 shrink-0">
            연동됨
          </Badge>
        )}
      </div>

      {isConnected ? (
        /* 연동 완료 상태 */
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-300">Notion 연동 완료</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                &apos;Self Study AI 오답노트&apos; 데이터베이스로 저장됩니다
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="https://www.notion.so" target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full text-sm dark:border-gray-600 dark:text-gray-300">
                <ExternalLink className="w-3.5 h-3.5 mr-2" />
                Notion에서 보기
              </Button>
            </a>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="연동 해제"
            >
              {isDisconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
            </Button>
          </div>
          {/* 재연결 */}
          <button
            onClick={handleConnect}
            className="w-full text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-1"
          >
            계정 변경 / 재연결
          </button>
        </div>
      ) : (
        /* 미연동 상태 */
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            버튼 하나로 Notion 계정을 연결하세요. 문제와 해설이 자동으로 오답노트에 저장됩니다.
          </p>
          <Button
            onClick={handleConnect}
            className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-semibold h-11 gap-2"
          >
            <div className="w-5 h-5 bg-white dark:bg-black rounded p-0.5">
              <NotionLogo className="w-full h-full text-black dark:text-white" />
            </div>
            Notion으로 연결하기
          </Button>
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            Notion 계정으로 안전하게 로그인됩니다
          </p>
        </div>
      )}
    </article>
  );
}
