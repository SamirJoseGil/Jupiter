// app/components/how-works-section.tsx
import { motion } from "framer-motion";
import ClientOnly from "./client-only";
import { FormIcon, ChartIcon, MessageIcon, CheckIcon } from "./icons";

export default function HowWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Radicar tu PQRSDF",
      description: "Completa el formulario con los detalles de tu petición, queja, reclamo, sugerencia o denuncia.",
      icon: FormIcon,
    },
    {
      number: 2,
      title: "Clasificación automática",
      description: "Nuestro sistema de IA clasifica y direcciona tu solicitud a la entidad correspondiente.",
      icon: ChartIcon,
    },
    {
      number: 3,
      title: "Seguimiento en tiempo real",
      description: "Recibe actualizaciones automáticas sobre el estado y progreso de tu solicitud.",
      icon: MessageIcon,
    },
    {
      number: 4,
      title: "Respuesta verificada",
      description: "Obtén una respuesta de la entidad oficial dentro del plazo legal establecido.",
      icon: CheckIcon,
    },
  ];

  return (
    <ClientOnly>
      <section id="servicios" className="flex min-h-screen items-center px-4 py-20 sm:px-6 lg:px-8 bg-white">
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
              Cómo Funciona
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Un proceso claro y directo para radicar y hacer seguimiento a tu solicitud dentro de la Alcaldía.
            </p>
          </motion.div>

          {/* Steps timeline */}
          <div className="space-y-6 relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 transform -translate-x-1/2" />

            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`md:grid md:grid-cols-2 gap-8 items-center relative ${
                    index % 2 === 0 ? "md:text-right" : ""
                  }`}
                >
                  {/* Content */}
                  <div className={index % 2 === 0 ? "md:col-start-1" : "md:col-start-2"}>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 hover:border-slate-300 transition">
                      <div className="flex md:justify-end items-center gap-4 mb-4">
                        <div className="hidden md:block text-right">
                          <p className="text-5xl font-black text-slate-300">{String(step.number).padStart(2, "0")}</p>
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">{step.title}</h3>
                      <p className="text-slate-600 text-lg">{step.description}</p>
                    </div>
                  </div>

                  {/* Icon circle */}
                  <div className="flex md:justify-center items-center my-8 md:my-0">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="relative z-10 w-24 h-24 rounded-full bg-slate-900 shadow-lg flex items-center justify-center"
                    >
                      <Icon className="w-12 h-12 text-white" />
                    </motion.div>
                  </div>

                  {/* Empty space for alternating layout */}
                  <div className={index % 2 === 0 ? "md:col-start-2" : "md:col-start-1 hidden md:block"} />
                </motion.div>
              );
            })}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 sm:p-12">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                ¿Listo para comenzar?
              </h3>
              <p className="text-slate-600 text-lg mb-6">
                Radicar tu PQRSDF es rápido, seguro y se gestiona directamente dentro del proceso institucional.
              </p>
              <a
                href="/user"
                className="inline-block rounded-2xl bg-slate-900 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-slate-800 active:scale-95"
              >
                Radicar PQRSDF Ahora
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </ClientOnly>
  );
}
