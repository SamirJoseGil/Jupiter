// app/components/what-is-pqrs.tsx
import { motion } from "framer-motion";
import ClientOnly from "./client-only";
import { InfoIcon, ShieldIcon, TargetIcon, CheckIcon } from "./icons";

export default function WhatIsPQRSDf() {
  const definitions = [
    {
      title: "Petición",
      description: "Solicitud de acción, omisión o pronunciamiento de una autoridad pública.",
      icon: ShieldIcon,
      color: "cyan"
    },
    {
      title: "Queja",
      description: "Expresión de insatisfacción sobre la acción u omisión de un servidor público.",
      icon: TargetIcon,
      color: "blue"
    },
    {
      title: "Reclamo",
      description: "Manifestación de inconformidad por prestación de un servicio público.",
      icon: CheckIcon,
      color: "indigo"
    },
    {
      title: "Sugerencia",
      description: "Propuesta de mejora en la prestación de servicios o funcionamiento de entidades.",
      icon: InfoIcon,
      color: "purple"
    },
    {
      title: "Denuncia",
      description: "Comunicación de hechos que constituyen infracciones, violaciones o irregularidades.",
      icon: ShieldIcon,
      color: "rose"
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <ClientOnly>
      <section id="que-es" className="flex min-h-screen items-center px-4 py-20 sm:px-6 lg:px-8 bg-white">
        <div className="mx-auto max-w-6xl w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16 text-center space-y-4"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900">
              ¿Qué es una PQRSDF?
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Aquí explicamos cómo funciona el canal institucional para que radicar una solicitud sea claro, directo y sin intermediarios.
            </p>
          </motion.div>

          {/* Grid de definiciones */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {definitions.map((def) => {
              const Icon = def.icon;
              const bgColor = {
                cyan: "from-slate-50 to-white border-slate-200",
                blue: "from-slate-50 to-white border-slate-200",
                indigo: "from-slate-50 to-white border-slate-200",
                purple: "from-slate-50 to-white border-slate-200",
                rose: "from-slate-50 to-white border-slate-200",
              }[def.color];

              const textColor = {
                cyan: "text-slate-700",
                blue: "text-slate-700",
                indigo: "text-slate-700",
                purple: "text-slate-700",
                rose: "text-slate-700",
              }[def.color];

              const bgIconColor = {
                cyan: "bg-slate-100",
                blue: "bg-slate-100",
                indigo: "bg-slate-100",
                purple: "bg-slate-100",
                rose: "bg-slate-100",
              }[def.color];

              return (
                <motion.div
                  key={def.title}
                  variants={item}
                  className={`rounded-2xl border-2 bg-gradient-to-br p-8 space-y-4 hover:shadow-lg transition ${bgColor}`}
                >
                  <div className={`w-12 h-12 rounded-full ${bgIconColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${textColor}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{def.title}</h3>
                  <p className="text-slate-700">{def.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Info adicional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-16 rounded-2xl border-2 border-slate-200 bg-slate-50 p-8 sm:p-12"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-4">¿Por qué es importante?</h3>
            <ul className="space-y-3 text-slate-700">
              <li className="flex gap-3">
                <span className="text-slate-600 font-bold flex-shrink-0">✓</span>
                <span>Garantiza tu derecho de petición como ciudadano</span>
              </li>
              <li className="flex gap-3">
                <span className="text-slate-600 font-bold flex-shrink-0">✓</span>
                <span>Permite la atención directa desde la Alcaldía</span>
              </li>
              <li className="flex gap-3">
                <span className="text-slate-600 font-bold flex-shrink-0">✓</span>
                <span>Genera trazabilidad y transparencia en la gestión pública</span>
              </li>
              <li className="flex gap-3">
                <span className="text-slate-600 font-bold flex-shrink-0">✓</span>
                <span>Protege tus derechos como usuario de servicios públicos</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>
    </ClientOnly>
  );
}
