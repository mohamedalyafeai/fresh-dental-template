import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface Appointment {
  id: string;
  patient_name: string;
  patient_email: string;
  patient_phone: string;
  service: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface PatientNote {
  id: string;
  patient_email: string;
  patient_name: string;
  note_content: string;
  created_at: string;
  updated_at: string;
}

interface Patient {
  email: string;
  name: string;
  phone: string;
  totalVisits: number;
  lastVisit: string | null;
  appointments: Appointment[];
}

interface PrintablePatientReportProps {
  patient: Patient;
  patientNotes: PatientNote[];
}

const PrintablePatientReport = ({ patient, patientNotes }: PrintablePatientReportProps) => {
  const completedAppointments = patient.appointments.filter(a => a.status === 'completed');
  const upcomingAppointments = patient.appointments.filter(a => a.status === 'confirmed' || a.status === 'pending');
  const cancelledAppointments = patient.appointments.filter(a => a.status === 'cancelled');

  // Get unique services (treatment summary)
  const treatmentSummary = patient.appointments.reduce((acc, apt) => {
    if (apt.status === 'completed') {
      acc[apt.service] = (acc[apt.service] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="print-report bg-white text-black p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BrightSmile Dental</h1>
            <p className="text-gray-600">123 Dental Avenue, Health City, HC 12345</p>
            <p className="text-gray-600">Phone: +1 (234) 567-8900 | Email: info@brightsmile.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">Patient Report</h2>
            <p className="text-gray-600">Generated: {format(new Date(), 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Full Name</p>
            <p className="font-medium text-gray-900">{patient.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium text-gray-900">{patient.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium text-gray-900">{patient.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Visits</p>
            <p className="font-medium text-gray-900">{patient.totalVisits}</p>
          </div>
        </div>
      </div>

      {/* Visit Summary */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Visit Summary</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-2xl font-bold text-gray-900">{patient.totalVisits}</p>
            <p className="text-sm text-gray-600">Total Visits</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-700">{completedAppointments.length}</p>
            <p className="text-sm text-green-600">Completed</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{upcomingAppointments.length}</p>
            <p className="text-sm text-blue-600">Upcoming</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-2xl font-bold text-red-700">{cancelledAppointments.length}</p>
            <p className="text-sm text-red-600">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Treatment Summary */}
      {Object.keys(treatmentSummary).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Treatment Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(treatmentSummary).map(([service, count]) => (
              <div key={service} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{service}</p>
                <p className="text-sm text-gray-600">{count} session{count !== 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Notes */}
      {patientNotes.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Doctor Notes</h3>
          <div className="space-y-3">
            {patientNotes.map(note => (
              <div key={note.id} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-500 mb-1">
                  {format(new Date(note.created_at), 'MMMM d, yyyy h:mm a')}
                </p>
                <p className="text-gray-900 whitespace-pre-wrap">{note.note_content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Appointment History */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Complete Appointment History</h3>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Date</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Time</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Service</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold text-gray-900">Notes</th>
            </tr>
          </thead>
          <tbody>
            {patient.appointments
              .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date))
              .map(apt => (
                <tr key={apt.id} className="odd:bg-white even:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                    {format(new Date(apt.appointment_date), 'MMM d, yyyy')}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                    {apt.appointment_time}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-gray-900">
                    {apt.service}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                      apt.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-gray-700">
                    {apt.notes || '-'}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-800 pt-4 mt-6">
        <p className="text-sm text-gray-500 text-center">
          This report was generated on {format(new Date(), 'MMMM d, yyyy')} at {format(new Date(), 'h:mm a')}.
          For questions, contact BrightSmile Dental at +1 (234) 567-8900.
        </p>
      </div>

      {/* Print-specific styles */}
      <style>{`
        @media print {
          .print-report {
            padding: 0;
            margin: 0;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintablePatientReport;
