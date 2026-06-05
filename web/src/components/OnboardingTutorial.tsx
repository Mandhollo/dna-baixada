'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Car,
  Palmtree,
  Trophy,
  Rocket,
  ChevronLeft,
  ChevronRight,
  SkipForward,
} from 'lucide-react';

const ONBOARDING_KEY = 'dna_baixada_onboarding_done';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const steps: Step[] = [
  {
    title: 'Bem-vindo ao DNA Baixada!',
    description:
      'Sua plataforma completa de mobilidade e turismo na Baixada Santista. Conectamos você a motoristas parceiros, passeios incríveis e muito mais — tudo com segurança e praticidade.',
    icon: <MapPin className="h-16 w-16" />,
    color: 'text-[#0A2463]',
    bgColor: 'bg-[#0A2463]/10',
  },
  {
    title: 'Solicite sua Corrida',
    description:
      'Peça uma corrida em poucos toques! Escolha entre corridas comuns, executivas, vans para grupos e muito mais. Acompanhe em tempo real e pague de forma fácil.',
    icon: <Car className="h-16 w-16" />,
    color: 'text-[#14A76C]',
    bgColor: 'bg-[#14A76C]/10',
  },
  {
    title: 'Explore o Turismo',
    description:
      'Descubra city tours exclusivos, pontos turísticos imperdíveis e roteiros personalizados pela Baixada Santista. Viva experiências únicas com guias locais.',
    icon: <Palmtree className="h-16 w-16" />,
    color: 'text-[#F5A623]',
    bgColor: 'bg-[#F5A623]/10',
  },
  {
    title: 'Acumule Pontos',
    description:
      'A cada corrida você ganha pontos! Troque por descontos, brindes exclusivos e experiências. Participe do DNA Social e suba no ranking da comunidade.',
    icon: <Trophy className="h-16 w-16" />,
    color: 'text-[#E84855]',
    bgColor: 'bg-[#E84855]/10',
  },
  {
    title: 'Vamos Começar!',
    description:
      'Tudo pronto para você explorar a plataforma. Solicite sua primeira corrida, descubra passeios e comece a acumular pontos agora mesmo!',
    icon: <Rocket className="h-16 w-16" />,
    color: 'text-[#0A2463]',
    bgColor: 'bg-[#14A76C]/10',
  },
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

export default function OnboardingTutorial({ onComplete }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const isLast = currentStep === steps.length - 1;

  function handleNext() {
    if (isLast) {
      handleClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }

  function handleClose() {
    setIsVisible(false);
    localStorage.setItem(ONBOARDING_KEY, '1');
    onComplete();
  }

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="relative mx-4 flex w-full max-w-lg flex-col items-center overflow-hidden rounded-3xl bg-white p-8 shadow-2xl sm:p-10"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Skip button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <SkipForward className="h-3.5 w-3.5" />
              Pular
            </button>

            {/* Step content with animation */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                className="flex flex-col items-center text-center"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -60, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              >
                {/* Icon */}
                <div
                  className={`mb-6 flex h-24 w-24 items-center justify-center rounded-2xl ${step.bgColor}`}
                >
                  <div className={step.color}>{step.icon}</div>
                </div>

                {/* Title */}
                <h2 className="mb-3 text-2xl font-extrabold text-gray-900">
                  {step.title}
                </h2>

                {/* Description */}
                <p className="max-w-sm text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="mt-8 flex items-center gap-2">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-6 bg-[#0A2463]'
                      : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para passo ${i + 1}`}
                />
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="mt-8 flex w-full items-center justify-between gap-3">
              {/* Back */}
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-1 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  currentStep === 0
                    ? 'cursor-not-allowed text-gray-300'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>

              {/* Next / CTA */}
              {isLast ? (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 rounded-xl bg-[#14A76C] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#14A76C]/25 transition hover:bg-[#12a063] hover:shadow-xl active:scale-95"
                >
                  Explorar a Plataforma
                  <Rocket className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 rounded-xl bg-[#0A2463] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#0A2463]/25 transition hover:bg-[#091f55] hover:shadow-xl active:scale-95"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
