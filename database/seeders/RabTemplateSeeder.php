<?php

namespace Database\Seeders;

use App\Models\RabTemplate;
use App\Models\RabTemplateItem;
use Illuminate\Database\Seeder;

class RabTemplateSeeder extends Seeder
{
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Pekerjaan Gedung',
                'description' => 'Item-item standar untuk pekerjaan pembangunan gedung bertingkat.',
                'items' => [
                    ['code' => '1.1', 'name' => 'Pekerjaan Pondasi', 'unit' => 'm3'],
                    ['code' => '1.2', 'name' => 'Pekerjaan Struktur Beton', 'unit' => 'm3'],
                    ['code' => '1.3', 'name' => 'Pekerjaan Dinding Bata', 'unit' => 'm2'],
                    ['code' => '1.4', 'name' => 'Pekerjaan Atap', 'unit' => 'm2'],
                    ['code' => '1.5', 'name' => 'Pekerjaan Plafon', 'unit' => 'm2'],
                    ['code' => '1.6', 'name' => 'Pekerjaan Lantai Keramik', 'unit' => 'm2'],
                    ['code' => '1.7', 'name' => 'Pekerjaan Pengecatan', 'unit' => 'm2'],
                    ['code' => '1.8', 'name' => 'Kusen, Pintu & Jendela', 'unit' => 'unit'],
                ],
            ],
            [
                'name' => 'Pekerjaan Jalan',
                'description' => 'Item-item standar untuk pekerjaan jalan dan drainase.',
                'items' => [
                    ['code' => '2.1', 'name' => 'Galian Tanah', 'unit' => 'm3'],
                    ['code' => '2.2', 'name' => 'Timbunan Tanah', 'unit' => 'm3'],
                    ['code' => '2.3', 'name' => 'Lapis Pondasi Bawah (LPB)', 'unit' => 'm3'],
                    ['code' => '2.4', 'name' => 'Lapis Pondasi Atas (LPA)', 'unit' => 'm3'],
                    ['code' => '2.5', 'name' => 'Pengaspalan Hotmix', 'unit' => 'm2'],
                    ['code' => '2.6', 'name' => 'Saluran Drainase', 'unit' => 'm1'],
                    ['code' => '2.7', 'name' => 'Pemasangan Rambu', 'unit' => 'unit'],
                ],
            ],
            [
                'name' => 'Pekerjaan Jembatan',
                'description' => 'Item-item standar untuk pekerjaan konstruksi jembatan beton.',
                'items' => [
                    ['code' => '3.1', 'name' => 'Pondasi Jembatan', 'unit' => 'm3'],
                    ['code' => '3.2', 'name' => 'Abutment', 'unit' => 'm3'],
                    ['code' => '3.3', 'name' => 'Pemasangan Girder', 'unit' => 'unit'],
                    ['code' => '3.4', 'name' => 'Lantai Jembatan', 'unit' => 'm2'],
                    ['code' => '3.5', 'name' => 'Parapet / Sandaran', 'unit' => 'm1'],
                    ['code' => '3.6', 'name' => 'Jalan Pendekat', 'unit' => 'm2'],
                ],
            ],
            [
                'name' => 'Mekanikal & Elektrikal',
                'description' => 'Item-item standar untuk instalasi mekanikal dan elektrikal.',
                'items' => [
                    ['code' => '4.1', 'name' => 'Panel Listrik', 'unit' => 'unit'],
                    ['code' => '4.2', 'name' => 'Instalasi Kabel', 'unit' => 'm1'],
                    ['code' => '4.3', 'name' => 'Pemasangan Lampu', 'unit' => 'unit'],
                    ['code' => '4.4', 'name' => 'Pemasangan AC', 'unit' => 'unit'],
                    ['code' => '4.5', 'name' => 'Pipa Air Bersih', 'unit' => 'm1'],
                    ['code' => '4.6', 'name' => 'Fire Alarm System', 'unit' => 'unit'],
                ],
            ],
            [
                'name' => 'Interior & Finishing',
                'description' => 'Item-item standar untuk pekerjaan interior dan finishing.',
                'items' => [
                    ['code' => '5.1', 'name' => 'Pemasangan Lantai', 'unit' => 'm2'],
                    ['code' => '5.2', 'name' => 'Dinding Panel / Partisi', 'unit' => 'm2'],
                    ['code' => '5.3', 'name' => 'Plafon Gypsum', 'unit' => 'm2'],
                    ['code' => '5.4', 'name' => 'Kitchen Set', 'unit' => 'unit'],
                    ['code' => '5.5', 'name' => 'Furniture Built-in', 'unit' => 'unit'],
                    ['code' => '5.6', 'name' => 'Finishing Cat', 'unit' => 'm2'],
                ],
            ],
        ];

        foreach ($templates as $tpl) {
            $items = $tpl['items'];
            unset($tpl['items']);

            $template = RabTemplate::updateOrCreate(['name' => $tpl['name']], $tpl);

            $template->items()->delete();

            foreach ($items as $i => $item) {
                RabTemplateItem::create([
                    'rab_template_id' => $template->id,
                    'code' => $item['code'],
                    'name' => $item['name'],
                    'unit' => $item['unit'],
                    'volume' => 0,
                    'unit_price' => 0,
                    'sort_order' => $i,
                ]);
            }
        }
    }
}
