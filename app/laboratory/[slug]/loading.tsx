export default function LaboratoryModuleLoading() {
    return (
        <div className="bg-[#f7f9fc] px-2 py-2 sm:px-3 md:px-4 md:py-3">
            <div className="mx-auto min-h-[calc(100dvh-88px)] max-w-[1880px] overflow-hidden rounded-[11px] border border-[#dde2e9] bg-white">
                <div className="flex h-[54px] items-center gap-2 border-b border-[#e5e8ed] px-3">
                    <div className="h-9 w-9 rounded-[8px] bg-[#f1f4f8]" />
                    <div className="h-9 w-24 rounded-[8px] bg-[#f1f4f8]" />
                    <div className="ml-2 h-9 w-[320px] max-w-[45vw] rounded-[8px] bg-[#f7f9fc]" />
                </div>
                <div className="grid gap-5 p-4 xl:grid-cols-12">
                    <div className="min-h-[520px] rounded-[10px] border border-[#e6e9ee] bg-[#fbfcfe] xl:col-span-4" />
                    <div className="space-y-5 xl:col-span-8">
                        <div className="min-h-[360px] rounded-[10px] border border-[#e6e9ee] bg-[#fbfcfe]" />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="h-28 rounded-[9px] border border-[#e8ebef] bg-white" />
                            <div className="h-28 rounded-[9px] border border-[#e8ebef] bg-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
