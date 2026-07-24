import { useState } from 'react';
import { Top, TextField, SearchField, ListRow, Button, BottomSheet, Spacing, Paragraph, Badge, useToast } from '@toss/tds-mobile';
import { useNavigate } from 'react-router-dom';
import { ScreenScaffold } from '@/components/ScreenScaffold';
import { SubmitFooter } from '@/components/BottomCTA';
import { EmptyState } from '@/components/StateView';
import { useAppData } from '@/lib/store';
import { BUILTIN_CERTS } from '@/lib/constants/certs';
import { calcDday } from '@/lib/calc';
import { todayStr } from '@/lib/utils';
import type { UserCert } from '@/lib/types';

export default function Select() {
  const navigate = useNavigate();
  const toast = useToast();
  const { setUserCert, setFlags } = useAppData();
  const [search, setSearch] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('');
  const [error, setError] = useState('');

  const today = todayStr();
  const query = search.trim();
  const filtered = query ? BUILTIN_CERTS.filter((c) => c.name.includes(query)) : BUILTIN_CERTS;

  function commitSelection(cert: UserCert) {
    const certResult = setUserCert(cert);
    const flagsResult = setFlags({ onboarded: true });
    if (!certResult.ok || !flagsResult.ok) {
      setError('저장 공간이 부족해요. 기기 저장공간을 확인해 주세요');
      try {
        toast.openToast('저장에 실패했어요. 저장 공간을 확인해 주세요');
      } catch {
        /* WebView 밖에서는 throw될 수 있음 — 무시 */
      }
      return;
    }
    navigate('/', { replace: true });
  }

  function selectBuiltin(certId: string, certName: string, certExamDate: string, recommendedTotalMinutes: number) {
    commitSelection({
      certId,
      name: certName,
      examDate: certExamDate,
      targetTotalMinutes: recommendedTotalMinutes,
      selectedAt: Date.now(),
      _v: 1,
    });
  }

  function submitCustom() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('시험 이름을 입력해주세요');
      return;
    }
    if (examDate && examDate < today) {
      setError('시험일은 오늘 이후로 설정해주세요');
      return;
    }
    const minutes = Number(targetMinutes);
    commitSelection({
      certId: `custom_${Date.now()}`,
      name: trimmedName,
      examDate: examDate || today,
      targetTotalMinutes: Number.isFinite(minutes) && minutes >= 60 ? minutes : 3000,
      selectedAt: Date.now(),
      _v: 1,
    });
  }

  return (
    <ScreenScaffold
      top={<Top title={<Top.TitleParagraph>학습할 자격증 선택</Top.TitleParagraph>} />}
      bottom={<SubmitFooter label="직접 등록" onClick={() => setSheetOpen(true)} />}
    >
      <SearchField
        placeholder="자격증 이름으로 검색"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onDeleteClick={() => setSearch('')}
      />
      <Spacing size={16} />

      {filtered.length === 0 ? (
        <EmptyState
          title="검색 결과가 없어요"
          action={
            <Button variant="weak" display="block" onClick={() => setSheetOpen(true)}>
              직접 등록
            </Button>
          }
          testId="select-empty"
        />
      ) : (
        filtered.map((cert) => (
          <ListRow
            key={cert.id}
            onClick={() => selectBuiltin(cert.id, cert.name, cert.examDate!, cert.recommendedTotalMinutes!)}
            contents={<ListRow.Texts type="2RowTypeA" top={cert.name} bottom={cert.category} />}
            right={
              <Badge size="small" variant="weak" color="blue">
                {calcDday(cert.examDate!, today)}
              </Badge>
            }
          />
        ))
      )}

      <Spacing size={96} />

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        header={<BottomSheet.Header>직접 등록</BottomSheet.Header>}
      >
        <TextField
          variant="box"
          label="시험 이름"
          placeholder="예: 사내 승진시험"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
        />
        <Spacing size={12} />
        <TextField
          variant="box"
          label="시험일"
          placeholder="2026-12-01"
          value={examDate}
          onChange={(e) => {
            setExamDate(e.target.value);
            setError('');
          }}
        />
        <Spacing size={12} />
        <TextField
          variant="box"
          label="목표 학습시간(분)"
          placeholder="3000"
          inputMode="numeric"
          value={targetMinutes}
          onChange={(e) => setTargetMinutes(e.target.value)}
        />
        {error ? (
          <>
            <Spacing size={8} />
            <Paragraph.Text typography="st13">{error}</Paragraph.Text>
          </>
        ) : null}
        <Spacing size={20} />
        <Button variant="fill" display="block" onClick={submitCustom}>
          등록하기
        </Button>
        <Spacing size={12} />
      </BottomSheet>
    </ScreenScaffold>
  );
}
