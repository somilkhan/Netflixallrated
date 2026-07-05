import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Ticker from '../components/Ticker';
import Hero from '../components/Hero';
import Tabs from '../components/Tabs';
import Section from '../components/Section';
import Card from '../components/Card';

export default function Home() {
  const [activeTab, setActiveTab] = useState('All');
  const [top10, setTop10] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any>(null);

  useEffect(() => { api.titles.top10().then(setTop10); api.titles.trending().then(setTrending); api.titles.recent().then(setRecent); api.titles.list({ limit: '1' }).then(d => setFeatured(d.titles[0])); }, []);
  const filter = (list: any[]) => activeTab === 'All' ? list : list.filter(t => t.type === activeTab.toUpperCase());

  return (
    <div>
      <Ticker />
      <Hero title={featured} />
      <Tabs active={activeTab} onChange={setActiveTab} />
      <Section title="Top 10 Today" count="10 titles">{filter(top10).map((t, i) => <Card key={t.id} title={t} index={i} rank={i + 1} />)}</Section>
      <Section title="Trending in India" count="24 titles">{filter(trending).map((t, i) => <Card key={t.id} title={t} index={i} />)}</Section>
      <Section title="Recently Added" count="18 titles">{filter(recent).map((t, i) => <Card key={t.id} title={t} index={i} />)}</Section>
    </div>
  );
}
