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

  useEffect(() => {
    api.titles.top10().then(setTop10);
    api.titles.trending().then(setTrending);
    api.titles.recent().then(setRecent);
  }, []);

  const filter = (list: any[]) =>
    activeTab === 'All' ? list : list.filter(t => t.type === activeTab.toUpperCase().replace('SERIES', 'SERIES').replace('ANIME', 'ANIME'));

  // Hero gets the top10 slice (up to 10); falls back to trending if top10 is empty
  const heroTitles = (top10.length ? top10 : trending).slice(0, 10);

  return (
    <div>
      <Ticker />
      <Hero titles={heroTitles} />
      <Tabs active={activeTab} onChange={setActiveTab} />
      <Section title="Top 10 Today" count="10 titles">
        {filter(top10).map((t, i) => <Card key={t.id} title={t} rank={i + 1} />)}
      </Section>
      <Section title="Trending" count="14 titles">
        {filter(trending).map((t) => <Card key={t.id} title={t} />)}
      </Section>
      <Section title="Recently Added" count="18 titles">
        {filter(recent).map((t) => <Card key={t.id} title={t} />)}
      </Section>
    </div>
  );
}
