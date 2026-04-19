// app/components/entities-section.tsx
import { motion } from "framer-motion";
import ClientOnly from "./client-only";

export default function EntitiesSection() {
  const entities = [
    {
      name: "Alcaldía de Medellín",
      description: "Entidad principal de gobierno municipal",
      color: "from-cyan-500 to-blue-500",
    },
    {
      name: "Secretaría de Movilidad",
      description: "Asuntos viales, transporte y tránsito",
      color: "from-blue-500 to-indigo-500",
    },
    {
      name: "Secretaría de Salud",
      description: "Servicios de salud y programas sanitarios",
      color: "from-indigo-500 to-purple-500",
    },
    {
      name: "Secretaría de Educación",
      description: "Servicios educativos municipales",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Secretaría de Ambiente",
      description: "Gestión ambiental y servicios públicos",
      color: "from-green-500 to-emerald-500",
    },
    {
      name: "Secretaría de Infraestructura",
      description: "Obras civiles y mantenimiento de infraestructura",
      color: "from-amber-500 to-orange-500",
    },
    {
      name: "Secretaría de Inclusión",
      description: "Atención a poblaciones vulnerables",
      color: "from-pink-500 to-rose-500",
    },
    {
      name: "Empresa de Servicios Públicos",
      description: "Agua, energía, aseo y otros servicios",
      color: "from-cyan-500 to-teal-500",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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
      <section id="entidades" className="flex min-h-screen items-center px-4 py-20 sm:px-6 lg:px-8 bg-slate-50">
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
              Entidades Disponibles
            </h2>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Estas son algunas de las dependencias y entidades de la Alcaldía que atienden solicitudes ciudadanas.
            </p>
          </motion.div>

          {/* Grid de entidades */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {entities.map((entity) => (
              <motion.div
                key={entity.name}
                variants={item}
                className="group cursor-pointer"
              >
                <div className="relative rounded-xl overflow-hidden bg-white border border-slate-200 p-6 hover:border-slate-300 transition h-full">
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white opacity-0 group-hover:opacity-100 transition" />

                  <div className="relative space-y-3">
                    {/* Icon dot */}
                    <div className="w-3 h-3 rounded-full bg-slate-500" />

                    <h3 className="font-bold text-slate-900 transition">
                      {entity.name}
                    </h3>
                    <p className="text-sm text-slate-600 group-hover:text-slate-700 transition">
                      {entity.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Info box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl border border-slate-200 bg-white p-8 sm:p-12"
          >
            <h3 className="text-xl font-bold text-slate-900 mb-3">
              Sin importar la dependencia, la atención sigue un mismo proceso interno
            </h3>
            <p className="text-slate-700">
              Tu solicitud será direccionada automáticamente al área correspondiente de la Alcaldía, seguida en tiempo real y respondida dentro de los términos legales establecidos.
            </p>
          </motion.div>
        </div>
      </section>
    </ClientOnly>
  );
}
